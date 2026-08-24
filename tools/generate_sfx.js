// ─────────────────────────────────────────────────────────────────────────────
// Fighters Of The Void — procedural SFX generator (v59.5 audio pass)
// Run:  node tools/generate_sfx.js
// Writes 16-bit mono 44.1kHz WAVs into assets/sfx/gen/
//
// Class sound signatures:
//   Controlled Human — grounded: noise-burst gun pews, metallic clanks, classic booms
//   Void Corrupted   — the same skeletons but FM-warbled / ring-modulated (warped alien)
//   Defender         — cleaner futuristic zaps: fast square sweeps, brighter filters
//   Void Pure        — otherworldly: no hard transients, swishes, swells, emanations
//   Void bullets     — energy (FM warble) vs. regular bullets (noise burst pews)
//
// v59.9 diversity pass: added a general-purpose toolkit extension (pink noise,
// resonant state-variable filter, chorus/tremolo, foldback/bitcrush distortion,
// PWM + detuned-unison oscillators, Karplus-Strong pluck, echo/stutter/morph,
// plus 4 new composite builders) so every category above has more than the 4
// existing class-signature templates to draw from. None of the 62 shipped
// sounds were changed — see TOOLKIT DEMOS at the end of this file to preview
// the additions; regenerate with `node tools/generate_sfx.js`.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'sfx');
fs.mkdirSync(OUT, { recursive: true });

// ── core helpers ─────────────────────────────────────────────────────────────
const buf = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));
const fn = (x) => (typeof x === 'function' ? x : () => x);

function mix(dst, src, atSec = 0, gain = 1) {
    const o = Math.round(atSec * SR);
    for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
    return dst;
}

function tone(sec, freq, amp, wave = 'sin') {
    const b = buf(sec), f = fn(freq), a = fn(amp);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
        const t = i / SR;
        ph += f(t) / SR;
        const p = ph - Math.floor(ph);
        let v;
        if (wave === 'saw') v = 2 * p - 1;
        else if (wave === 'sq') v = p < 0.5 ? 1 : -1;
        else if (wave === 'tri') v = p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
        else v = Math.sin(2 * Math.PI * p);
        b[i] = v * a(t);
    }
    return b;
}

// FM: carrier freq fn, modulator at ratio*carrier, index fn (in carrier-freq units)
function fmTone(sec, freq, ratio, index, amp) {
    const b = buf(sec), f = fn(freq), ix = fn(index), a = fn(amp);
    let cph = 0, mph = 0;
    for (let i = 0; i < b.length; i++) {
        const t = i / SR;
        const cf = f(t);
        mph += (cf * ratio) / SR;
        cph += (cf + Math.sin(2 * Math.PI * mph) * cf * ix(t)) / SR;
        b[i] = Math.sin(2 * Math.PI * cph) * a(t);
    }
    return b;
}

// ── diversity pass (v59.9): new oscillator/noise/filter/effect primitives ──
// These extend the toolkit beyond the original sin/saw/sq/tri + FM + white/brown
// noise + one-pole filter set, so future sounds (in any category) aren't stuck
// reusing the same handful of building blocks. Nothing below is wired into an
// existing sfxList sound yet — see the TOOLKIT DEMOS block at the end of this
// file to hear each one in isolation.

// Pulse-width-modulated square: variable duty cycle gives a buzzier/thinner-to-
// fatter spectrum than tone()'s fixed 50% square, and width can be swept over time.
function pwm(sec, freq, width, amp) {
    const b = buf(sec), f = fn(freq), w = fn(width), a = fn(amp);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
        const t = i / SR;
        ph += f(t) / SR;
        const p = ph - Math.floor(ph);
        b[i] = (p < Math.max(0.02, Math.min(0.98, w(t))) ? 1 : -1) * a(t);
    }
    return b;
}

// Dense detuned-unison stack (supersaw-style) — a reusable generalisation of the
// hand-rolled "for (v=0;v<3;v++) mix(tone(...detune...))" loops used ad hoc in a
// few existing sounds (e.g. Knight_Laser). Any voice count/spread/waveform now
// available as one call instead of hand-written boilerplate.
function detunedUnison(sec, freq, amp, wave = 'saw', voices = 5, spreadCents = 16) {
    const b = buf(sec), f = fn(freq);
    for (let v = 0; v < voices; v++) {
        const centOffset = (v - (voices - 1) / 2) * (spreadCents / Math.max(1, voices - 1));
        const ratio = Math.pow(2, centOffset / 1200);
        mix(b, tone(sec, (t) => f(t) * ratio, amp, wave), 0, 1 / voices);
    }
    return b;
}

// Karplus-Strong plucked-string: a genuinely new timbral family (physical
// modeling of a resonating string) next to the file's existing purely
// subtractive/FM/noise sounds. `decay` close to 1 sustains longer (a taut,
// ringing string); lower values die out fast (a muted thock).
function pluck(freqHz, sec, decay = 0.996) {
    const b = buf(sec);
    const period = Math.max(2, Math.round(SR / freqHz));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < b.length; i++) {
        b[i] = ring[idx];
        const next = ring[(idx + 1) % period];
        ring[idx] = ((ring[idx] + next) * 0.5) * decay;
        idx = (idx + 1) % period;
    }
    return b;
}

function whiteNoise(sec, amp) {
    const b = buf(sec), a = fn(amp);
    for (let i = 0; i < b.length; i++) b[i] = (Math.random() * 2 - 1) * a(i / SR);
    return b;
}

function brownNoise(sec, amp) {
    const b = buf(sec), a = fn(amp);
    let v = 0;
    for (let i = 0; i < b.length; i++) {
        v = v * 0.985 + (Math.random() * 2 - 1) * 0.12;
        b[i] = v * 6 * a(i / SR);
    }
    return b;
}

// Pink (1/f) noise — warmer/airier than white, brighter and less rumbly than
// brown. Sits between the two existing noise colors; good for organic wind/
// hiss/atmosphere textures that don't need brown's dull thump or white's harshness.
// (Paul Kellet's economy 3-pole approximation.)
function pinkNoise(sec, amp) {
    const b = buf(sec), a = fn(amp);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < b.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        b[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11 * a(i / SR);
    }
    return b;
}

// One-pole lowpass with time-varying cutoff
function lowpass(b, cutoff) {
    const c = fn(cutoff);
    let y = 0;
    for (let i = 0; i < b.length; i++) {
        const k = 1 - Math.exp((-2 * Math.PI * Math.max(20, c(i / SR))) / SR);
        y += k * (b[i] - y);
        b[i] = y;
    }
    return b;
}

function highpass(b, cutoff) {
    const c = fn(cutoff);
    let y = 0, xp = 0;
    for (let i = 0; i < b.length; i++) {
        const k = Math.exp((-2 * Math.PI * Math.max(20, c(i / SR))) / SR);
        y = k * (y + b[i] - xp);
        xp = b[i];
        b[i] = y;
    }
    return b;
}

function bandpass(b, center, width = 0.5) {
    const c = fn(center);
    const copy = Float32Array.from(b);
    lowpass(copy, (t) => c(t) * (1 + width));
    highpass(copy, (t) => c(t) / (1 + width));
    for (let i = 0; i < b.length; i++) b[i] = copy[i];
    return b;
}

// Resonant state-variable filter (Chamberlin design) — unlike the one-pole
// low/high/bandpass above, this has a genuine resonance peak: at low `resonance`
// it's mellow, cranked up toward ~3+ it screams/near-self-oscillates. Classic
// synth "filter sweep / wah" character the plain filters above can't produce.
// mode: 'low' | 'band' | 'high'.
function resonantFilter(b, cutoff, resonance = 1, mode = 'low') {
    const c = fn(cutoff), q = fn(resonance);
    let low = 0, band = 0;
    for (let i = 0; i < b.length; i++) {
        const t = i / SR;
        const f = 2 * Math.sin(Math.PI * Math.min(0.245, Math.max(20, c(t)) / SR));
        const damp = Math.min(2, 1 / Math.max(0.1, q(t)));
        low += f * band;
        const high = b[i] - low - damp * band;
        band += f * high;
        b[i] = mode === 'high' ? high : mode === 'band' ? band : low;
    }
    return b;
}

function ringmod(b, freq) {
    const f = fn(freq);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
        ph += f(i / SR) / SR;
        b[i] *= Math.sin(2 * Math.PI * ph);
    }
    return b;
}

// Modulated-delay chorus: thickens/widens/detunes ANY existing buffer (noise,
// tone stacks, whole composite sounds) — a generic alternative to hand-building
// fixed-ratio detune stacks per-sound. mixAmt near 1.0 with a slower/deeper LFO
// reads as vibrato (pitch wobble) instead of thickening; both are the same knob.
function chorus(b, depthMs = 8, rateHz = 0.6, mixAmt = 0.5) {
    const n = b.length;
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const delaySamples = (depthMs / 1000) * SR * (0.5 + 0.5 * Math.sin(2 * Math.PI * rateHz * t));
        const srcPos = i - delaySamples;
        const i0 = Math.floor(srcPos), i1 = i0 + 1, frac = srcPos - i0;
        const s0 = i0 >= 0 && i0 < n ? b[i0] : 0;
        const s1 = i1 >= 0 && i1 < n ? b[i1] : 0;
        const wet = s0 * (1 - frac) + s1 * frac;
        out[i] = b[i] * (1 - mixAmt) + wet * mixAmt;
    }
    for (let i = 0; i < n; i++) b[i] = out[i];
    return b;
}

// Amplitude tremolo — a named, reusable version of the ad hoc
// gain(b, t => 1 + k*sin(...)) pulsing seen once in the existing file;
// throbbing/pulsing character applicable to any category.
function tremolo(b, rateHz = 6, depth = 0.5) {
    return gain(b, (t) => 1 - depth * 0.5 + depth * 0.5 * Math.sin(2 * Math.PI * rateHz * t));
}

function softclip(b, drive = 2) {
    for (let i = 0; i < b.length; i++) b[i] = Math.tanh(b[i] * drive);
    return b;
}

// Wavefolder distortion — past `threshold` the signal folds back on itself
// instead of smoothly compressing like softclip's tanh. Harsher, weirder,
// more "broken glass" than saturated; good for aggressive/corrupted textures.
function foldback(b, threshold = 0.6) {
    for (let i = 0; i < b.length; i++) {
        let v = b[i];
        while (Math.abs(v) > threshold) {
            v = v > 0 ? (2 * threshold - v) : (-2 * threshold - v);
        }
        b[i] = v;
    }
    return b;
}

// Bitcrusher — quantizes amplitude to `bits` levels and sample-and-holds every
// `rateDivide` samples (effective sample-rate reduction). Robotic/lo-fi digital
// crunch, a different flavor of "corrupted" than the ring-mod/FM warble already
// used for Void enemies — better suited to machine/glitch/digital-malfunction sounds.
function bitcrush(b, bits = 6, rateDivide = 4) {
    const levels = Math.pow(2, bits);
    let held = 0;
    for (let i = 0; i < b.length; i++) {
        if (i % rateDivide === 0) held = Math.round(b[i] * levels) / levels;
        b[i] = held;
    }
    return b;
}

function gain(b, g) {
    const gg = fn(g);
    for (let i = 0; i < b.length; i++) b[i] *= gg(i / SR);
    return b;
}

function normalize(b, peak = 0.88) {
    let m = 0;
    for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i]));
    if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
    return b;
}

// Short fade at both ends to kill clicks
function declick(b, ms = 4) {
    const n = Math.min(b.length >> 1, Math.round((ms / 1000) * SR));
    for (let i = 0; i < n; i++) {
        const g = i / n;
        b[i] *= g;
        b[b.length - 1 - i] *= g;
    }
    return b;
}

// Make a buffer loop seamlessly: crossfade tail into head, trim the tail
function loopify(b, fadeSec = 0.5) {
    const f = Math.round(fadeSec * SR);
    const out = new Float32Array(b.length - f);
    for (let i = 0; i < out.length; i++) out[i] = b[i + f];
    for (let i = 0; i < f; i++) {
        const g = i / f;
        out[out.length - f + i] = out[out.length - f + i] * (1 - g) + b[i + f] * 0 + b[i] * g;
    }
    return out;
}

// Discrete decaying echo taps — rhythmic repeats rather than a continuous
// texture. Extends the buffer's length (returns a new, longer array). Good for
// menacing telegraphs / corrupted-signal repeats that nothing above produces.
function echo(b, delaySec = 0.12, feedback = 0.4, taps = 3) {
    const d = Math.round(delaySec * SR);
    const out = new Float32Array(b.length + d * taps);
    for (let i = 0; i < b.length; i++) out[i] += b[i];
    let g = feedback;
    for (let t = 1; t <= taps; t++) {
        for (let i = 0; i < b.length; i++) {
            const o = i + d * t;
            if (o < out.length) out[o] += b[i] * g;
        }
        g *= feedback;
    }
    return out;
}

// Glitch-stutter: chops a buffer into grains and randomly re-repeats some of
// them. A rhythmic-glitch texture distinct from the Machine's existing
// ringmod-based servo-grind — reads as a skipping/corrupted signal.
function stutter(b, grainMs = 20, repeatChance = 0.35, maxRepeats = 3) {
    const grain = Math.max(1, Math.round((grainMs / 1000) * SR));
    const out = [];
    for (let i = 0; i < b.length; i += grain) {
        const chunk = b.slice(i, Math.min(b.length, i + grain));
        out.push(chunk);
        if (Math.random() < repeatChance) {
            const reps = 1 + Math.floor(Math.random() * maxRepeats);
            for (let r = 0; r < reps; r++) out.push(chunk);
        }
    }
    const total = out.reduce((s, c) => s + c.length, 0);
    const res = new Float32Array(total);
    let o = 0;
    for (const c of out) { res.set(c, o); o += c.length; }
    return res;
}

// Crossfades two buffers over time according to mixFn (0 = all `a`, 1 = all
// `b`), rather than mix()'s fixed-gain overlay. Lets one sound genuinely
// morph into another — e.g. a metal thunk dissolving into a Void FM warble
// for a "corrupted metal" hybrid — which additive mixing can't produce.
function morph(a, b, mixFn) {
    const n = Math.max(a.length, b.length);
    const out = new Float32Array(n);
    const m = fn(mixFn);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const av = i < a.length ? a[i] : 0;
        const bv = i < b.length ? b[i] : 0;
        const k = Math.max(0, Math.min(1, m(t)));
        out[i] = av * (1 - k) + bv * k;
    }
    return out;
}

// envelopes
const expDecay = (T, delay = 0) => (t) => (t < delay ? 0 : Math.exp(-(t - delay) / T));
const attackDecay = (atk, T) => (t) => (t < atk ? t / atk : Math.exp(-(t - atk) / T));
const swell = (up, hold, down, total) => (t) => {
    if (t < up) return t / up;
    if (t < up + hold) return 1;
    return Math.max(0, 1 - (t - up - hold) / down);
};

// Regenerate a single sound without touching the rest (protects hand-kept
// variants on disk):  ONLY_SFX=Player_Death node tools/generate_sfx.js
const ONLY_SFX = process.env.ONLY_SFX;
if (ONLY_SFX) console.log('ONLY_SFX="' + ONLY_SFX + '" is set — every other sound will be SKIPPED this run.');

// v59.8: writeFileSync occasionally throws on Windows for a file that's
// transiently locked (antivirus scanning the new file, OneDrive/cloud sync,
// the WAV still open in a media player/preview tab) — that used to be an
// uncaught exception that killed the whole script mid-list, silently
// skipping every sound after the one that failed. Retry a few times first
// (the lock is almost always gone within a few hundred ms), and if it still
// fails, record it and keep going instead of aborting the rest of the batch.
const failedWrites = [];
let writtenCount = 0;

function sleepMs(ms) {
    try {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    } catch (e) { /* no SharedArrayBuffer/Atomics — skip the wait, retry immediately */ }
}

function writeWav(name, samples, dir = OUT) {
    if (ONLY_SFX && !name.startsWith(ONLY_SFX)) return;
    const n = samples.length;
    const data = Buffer.alloc(44 + n * 2);
    data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVE', 8);
    data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
    data.writeUInt16LE(1, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28);
    data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
    data.write('data', 36); data.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
        const v = Math.max(-1, Math.min(1, samples[i]));
        data.writeInt16LE((v * 32767) | 0, 44 + i * 2);
    }
    const filePath = path.join(dir, name + '.wav');
    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, data);
            console.log('  ' + name + '.wav  (' + (n / SR).toFixed(2) + 's, ' + Math.round(data.length / 1024) + 'KB)');
            writtenCount++;
            return;
        } catch (e) {
            if (attempt === MAX_ATTEMPTS) {
                console.error('  ✗ FAILED: ' + name + '.wav — ' + e.message);
                failedWrites.push(name);
                return;
            }
            sleepMs(150 * attempt); // back off and retry — most locks clear within a few hundred ms
        }
    }
}

// composite builders
function explosion(sec, depth = 1, crackles = 2) {
    // depth 0.6 = small/snappy ... 1.6 = huge/deep
    // v3: smooth & clean — v2's softclip(1.7) over stacked full-scale layers was audibly
    // distorting, and the 650Hz banded "knock" transient read as a clang
    const b = buf(sec);
    // soft initial thump: lowpassed noise, no mid-band knock
    mix(b, lowpass(whiteNoise(0.07, expDecay(0.025)), 900 / Math.sqrt(depth)), 0, 0.8);
    // main body: brown noise with a closing filter — this carries the sound
    const body = brownNoise(sec, attackDecay(0.01, sec * 0.38));
    lowpass(body, (t) => Math.max(60, (700 / depth) * Math.exp(-t / (sec * 0.45))));
    mix(b, body, 0, 1.0);
    // low whump: noise-based, not tonal
    mix(b, lowpass(brownNoise(Math.min(sec, 0.5 * depth), expDecay(0.14 * depth)), 130), 0, 0.7);
    // soft sub only on truly big blasts
    if (depth > 1.1) {
        mix(b, tone(0.5 * depth, (t) => 55 - t * 22, expDecay(0.17 * depth)), 0, 0.35);
    }
    // debris crackles — quieter, lower band
    for (let c = 0; c < crackles; c++) {
        const at = 0.05 + Math.random() * sec * 0.5;
        mix(b, lowpass(whiteNoise(0.04, expDecay(0.015)), R(600, 1400)), at, R(0.12, 0.25));
    }
    return softclip(b, 1.05); // barely-there saturation
}

// Metal-damage hit: noise thunk + scrape + faint (non-musical) resonance.
// Replaces the old bell-like partial clanks that read as "clanging".
function metalDamage(centerHz, sec = 0.12, resPartials = []) {
    const b = buf(sec);
    // impact body: banded noise thunk
    mix(b, bandpass(whiteNoise(sec, expDecay(sec * 0.3)), centerHz, 0.7), 0, 1.1);
    // scrape: flickering high noise — metal tearing/denting
    const scr = highpass(whiteNoise(sec * 0.75, expDecay(sec * 0.22)), centerHz * 1.5);
    gain(scr, (t) => 0.55 + 0.45 * Math.sin(t * 740 + Math.sin(t * 313) * 3));
    mix(b, scr, 0.004, 0.55);
    // very faint metallic resonance — low gain so it never rings musically
    resPartials.forEach(([f, g]) => mix(b, tone(sec, f, expDecay(sec * 0.18)), 0, g));
    // low thud
    mix(b, lowpass(whiteNoise(0.05, expDecay(0.02)), 280), 0, 0.75);
    return b;
}

function bellNote(freqHz, sec = 0.3, bright = 1) {
    const b = buf(sec);
    mix(b, tone(sec, freqHz, expDecay(sec * 0.32)), 0, 1);
    mix(b, tone(sec, freqHz * 2.76, expDecay(sec * 0.18)), 0, 0.34 * bright);
    mix(b, tone(sec, freqHz * 5.4, expDecay(sec * 0.1)), 0, 0.12 * bright);
    return b;
}

function metalClank(partials, sec = 0.2, noiseTick = true) {
    const b = buf(sec);
    partials.forEach(([f, g], i) => {
        mix(b, tone(sec, f, expDecay(sec * (0.32 - i * 0.04))), 0, g);
    });
    if (noiseTick) mix(b, highpass(whiteNoise(0.015, expDecay(0.005)), 2000), 0, 0.5);
    return b;
}

// ── diversity pass (v59.9): new composite builders on top of the primitives above ──
// Not wired into any category's sounds yet (this pass is toolkit-only) — kept
// alongside explosion()/metalDamage()/bellNote()/metalClank() as options for
// future sounds in any category.

// Crisp taut "snap"/ping — physical-modeling family, distinct from bellNote's
// pure sine partials and metalClank's abrupt percussive decay.
function stringPing(freqHz, sec = 0.5, decay = 0.996) {
    return highpass(pluck(freqHz, sec, decay), freqHz * 0.5);
}

// Warmer, more organic atmospheric swell than the existing bandpass(whiteNoise)
// approach — pinkNoise's 1/f rolloff plus a genuine resonant sweep gives it
// body and a "wow" the plain filters can't produce. Good for Void Pure/ambient use.
function windSwell(sec, cutoffLow = 400, cutoffHigh = 2200) {
    const b = pinkNoise(sec, swell(sec * 0.25, sec * 0.15, sec * 0.5, sec));
    return resonantFilter(b, (t) => cutoffLow + (cutoffHigh - cutoffLow) * (t / sec), 2.2, 'band');
}

// Harsher, more distorted alien voice than the gentle FM warbles used so far —
// foldback distortion plus chorus widening on an FM voice. Good for
// higher-intensity Void Corrupted moments (enraged states, boss-phase spikes).
function alienScreech(sec, freq = 500, index = 3) {
    const b = fmTone(sec, (t) => freq * Math.exp(-t * 1.5) + freq * 0.3, 2.3, index, attackDecay(0.01, sec * 0.4));
    foldback(b, 0.5);
    return chorus(b, 6, 5.5, 0.4);
}

// Corrupted-machine/digital-malfunction texture — PWM burst + bitcrush +
// stutter-chop. Distinct from Machine Of The Void's existing ringmod/servo-grind
// approach; a candidate for future corrupted-tech enemies/effects.
function digitalGlitch(sec, density = 0.4) {
    const b = pwm(sec, (t) => 200 + Math.sin(t * 40) * 600, (t) => 0.2 + 0.3 * Math.sin(t * 17), attackDecay(0.01, sec * 0.5));
    bitcrush(b, 5, 6);
    return stutter(b, 18, density, 2);
}

const R = (a, b2) => a + Math.random() * (b2 - a);
console.log('Generating SFX into ' + OUT);

// ════════════════════════ PLAYER WEAPONS ════════════════════════
{   // Tracking gun: soft round 'thoomp' — v3: the FM blip was too sharp/distracting
    const b = buf(0.12);
    mix(b, tone(0.11, (t) => 330 - t * 700, attackDecay(0.012, 0.04)), 0, 1);
    mix(b, lowpass(whiteNoise(0.05, attackDecay(0.008, 0.018)), 1100), 0, 0.25);
    lowpass(b, 1800);
    writeWav('Player_Shoot_Tracking_a', normalize(declick(b), 0.5));
}
{   // Curved gun: soft swoosh — v3: tamed (less noise, lowpassed, slower attack)
    const b = buf(0.13);
    mix(b, bandpass(whiteNoise(0.13, attackDecay(0.012, 0.045)), (t) => 1200 - t * 5200, 0.5), 0, 0.5);
    mix(b, tone(0.11, (t) => 540 - t * 1800, attackDecay(0.008, 0.04)), 0, 0.8);
    lowpass(b, 2600);
    writeWav('Player_Shoot_Curved_a', normalize(declick(b), 0.55));
}
{   // Tracking overflow burst: magenta energy explosion + rising sparkle
    const b = buf(0.65);
    mix(b, fmTone(0.5, (t) => 220 - t * 240, 1.5, 2.2, attackDecay(0.005, 0.16)), 0, 1);
    mix(b, explosion(0.5, 0.8, 1), 0, 0.5);
    [900, 1200, 1500, 1900].forEach((f, i) => mix(b, bellNote(f, 0.18, 1.2), 0.16 + i * 0.06, 0.3));
    writeWav('Player_Overflow_Burst_a', normalize(declick(b)));
}
{   // Player laser (firepower-max attack): clean heroic beam
    const b = buf(0.4);
    for (let v = 0; v < 3; v++) {
        mix(b, tone(0.36, (t) => (1250 - t * 1900) * (1 + (v - 1) * 0.008), attackDecay(0.006, 0.14), 'saw'), 0, 0.45);
    }
    mix(b, tone(0.3, (t) => 220 - t * 150, expDecay(0.12)), 0, 0.5);
    mix(b, highpass(whiteNoise(0.3, expDecay(0.1)), 3000), 0, 0.2);
    writeWav('Player_Laser_a', normalize(declick(softclip(b, 1.4))));
}
{   // Lance: deep energy punch
    const b = buf(0.45);
    mix(b, tone(0.4, (t) => 170 - t * 240, attackDecay(0.004, 0.14), 'sq'), 0, 0.7);
    mix(b, fmTone(0.35, (t) => 340 - t * 300, 3.1, 1.4, expDecay(0.1)), 0, 0.5);
    mix(b, highpass(whiteNoise(0.25, expDecay(0.08)), 2200), 0, 0.25);
    writeWav('Player_Lance_a', normalize(declick(softclip(b, 1.5))));
}

// ════════════════════════ POWERUPS (shared soft-chime family) ════════════════════════
// v2: subtler, warmer, less cartoonish — pure-ish sines, lowpassed, fewer/softer notes
function softChime(freqHz, sec = 0.24) {
    const b = buf(sec);
    mix(b, tone(sec, freqHz, attackDecay(0.01, sec * 0.3)), 0, 1);
    mix(b, tone(sec, freqHz * 2.005, attackDecay(0.01, sec * 0.16)), 0, 0.1);
    lowpass(b, 3000);
    return b;
}
{   const b = buf(0.4); [523, 659, 784].forEach((f, i) => mix(b, softChime(f, 0.26), i * 0.07, 0.75));
    writeWav('Powerup_Health_a', normalize(declick(b), 0.62)); }
{   const b = buf(0.42);
    mix(b, softChime(392, 0.28), 0, 0.8); mix(b, softChime(587, 0.3), 0.09, 0.7);
    mix(b, lowpass(whiteNoise(0.26, swell(0.06, 0.04, 0.16, 0.26)), 2400), 0.1, 0.1);
    writeWav('Powerup_Shield_a', normalize(declick(b), 0.62)); }
{   const b = buf(0.38); [659, 784, 988].forEach((f, i) => mix(b, softChime(f, 0.22), i * 0.06, 0.72));
    writeWav('Powerup_Firepower_a', normalize(declick(b), 0.62)); }
{   const b = buf(0.36); [880, 1047, 1175].forEach((f, i) => mix(b, softChime(f, 0.14), i * 0.055, 0.65));
    writeWav('Powerup_RapidFire_a', normalize(declick(b), 0.6)); }
{   const b = buf(0.32);
    mix(b, lowpass(tone(0.26, (t) => 520 + t * 1300, attackDecay(0.012, 0.1)), 2600), 0, 0.7);
    mix(b, softChime(932, 0.16), 0.13, 0.4);
    writeWav('Powerup_SpeedUp_a', normalize(declick(b), 0.6)); }
{   const b = buf(0.36);
    mix(b, lowpass(tone(0.32, (t) => 740 - t * 1000, attackDecay(0.012, 0.13)), 2200), 0, 0.7);
    mix(b, lowpass(tone(0.32, (t) => 743 - t * 1004, attackDecay(0.012, 0.13)), 2200), 0, 0.42); // gentle beat womp
    writeWav('Powerup_SpeedDown_a', normalize(declick(b), 0.6)); }
{   const b = buf(0.4); [587, 740, 880].forEach((f, i) => mix(b, softChime(f, 0.24), i * 0.065, 0.68));
    mix(b, fmTone(0.14, 880, 5, 0.35, expDecay(0.05)), 0.2, 0.14);
    writeWav('Powerup_Tracking_a', normalize(declick(b), 0.62)); }
{   const b = buf(0.38);
    mix(b, softChime(523, 0.24), 0, 0.75);
    mix(b, lowpass(tone(0.22, (t) => 698 * (1 + t * 0.28), expDecay(0.08)), 2600), 0.08, 0.4);
    writeWav('Powerup_Curved_a', normalize(declick(b), 0.62)); }

// ════════════════════════ ENEMY SHOOTING — class signatures ════════════════════════
{   // Controlled Human standard: grounded gun pew (noise burst + low blip)
    const b = buf(0.1);
    mix(b, highpass(whiteNoise(0.07, expDecay(0.018)), 900), 0, 0.85);
    mix(b, tone(0.08, (t) => 330 - t * 1700, expDecay(0.03), 'sq'), 0, 0.5);
    writeWav('Enemy_Normal_Shoot_a', normalize(declick(b), 0.8)); }
{   // Human heavy: deeper, more body
    const b = buf(0.16);
    mix(b, lowpass(whiteNoise(0.12, expDecay(0.035)), 1600), 0, 0.9);
    mix(b, tone(0.13, (t) => 200 - t * 700, expDecay(0.05), 'sq'), 0, 0.65);
    writeWav('Enemy_Heavy_Shoot_a', normalize(declick(b), 0.82)); }
{   // Human sniper: sharp crack
    const b = buf(0.14);
    mix(b, highpass(whiteNoise(0.025, expDecay(0.006)), 2600), 0, 1);
    mix(b, tone(0.12, (t) => 1150 - t * 3400, expDecay(0.035)), 0, 0.5);
    writeWav('Enemy_Sniper_Shoot_a', normalize(declick(b), 0.8)); }
{   // Drone: tiny chirp
    const b = tone(0.06, (t) => 950 - t * 6500, attackDecay(0.003, 0.02), 'tri');
    mix(b, highpass(whiteNoise(0.03, expDecay(0.01)), 2000), 0, 0.3);
    writeWav('Enemy_Drone_Shoot_a', normalize(declick(b), 0.68)); }
{   // Void energy shot: FM warble (alien energy vs. ballistic)
    const b = fmTone(0.16, (t) => 520 - t * 1500, 1.41, (t) => 1.8 + Math.sin(t * 250) * 0.7, attackDecay(0.004, 0.05));
    writeWav('Void_Shoot_a', normalize(declick(b), 0.75)); }
{   // Void sniper: deeper void energy crack with ring tail
    const b = buf(0.24);
    mix(b, fmTone(0.2, (t) => 740 - t * 2400, 2.3, 2.4, attackDecay(0.003, 0.06)), 0, 1);
    mix(b, ringmod(tone(0.2, 320, expDecay(0.08)), 47), 0.02, 0.5);
    writeWav('Void_Sniper_Shoot_a', normalize(declick(b), 0.78)); }
{   // Pure Void: swishing emanation — no attack transient
    const b = buf(0.3);
    mix(b, bandpass(whiteNoise(0.3, swell(0.08, 0.04, 0.18, 0.3)), (t) => 900 - t * 1400, 0.5), 0, 1);
    mix(b, tone(0.28, (t) => 150 - t * 60, swell(0.08, 0.05, 0.15, 0.28)), 0, 0.4);
    writeWav('PureVoid_Shoot_a', normalize(declick(b), 0.7)); }
{   // Defender: clean futuristic zap
    const b = buf(0.09);
    mix(b, tone(0.08, (t) => 1450 - t * 9500, attackDecay(0.002, 0.03), 'sq'), 0, 0.7);
    mix(b, tone(0.07, (t) => 720 - t * 4000, expDecay(0.025)), 0, 0.5);
    writeWav('Defender_Shoot_a', normalize(declick(b), 0.74)); }
{   // Defender heavy: dual-tone heavier zap
    const b = buf(0.17);
    mix(b, tone(0.15, (t) => 700 - t * 2700, attackDecay(0.003, 0.05), 'sq'), 0, 0.65);
    mix(b, tone(0.15, (t) => 1060 - t * 4100, attackDecay(0.003, 0.045), 'saw'), 0, 0.45);
    mix(b, lowpass(whiteNoise(0.08, expDecay(0.025)), 2000), 0, 0.4);
    writeWav('Defender_Heavy_Shoot_a', normalize(declick(b), 0.78)); }

// ════════════════════════ HITS (non-lethal) ════════════════════════
// v2: metal being DAMAGED (noise thunk + scrape), not metal being rung like a bell
{   writeWav('Metal_Hit_a', normalize(declick(metalDamage(1000, 0.11, [[740, 0.16]])), 0.76)); }
{   writeWav('Metal_Hit_2_a', normalize(declick(metalDamage(820, 0.13, [[612, 0.14]])), 0.76)); }
{   // Defender hit: same damage skeleton, slightly brighter + a tiny synthetic blip
    const b = metalDamage(1250, 0.1, [[980, 0.15]]);
    mix(b, tone(0.05, (t) => 1500 - t * 9000, expDecay(0.014), 'sq'), 0.004, 0.16);
    writeWav('Defender_Hit_a', normalize(declick(b), 0.74)); }
{   // Void corrupted hit: damage skeleton with a warped FM wisp
    const b = metalDamage(880, 0.14, [[660, 0.13]]);
    mix(b, fmTone(0.1, (t) => 360 - t * 600, 1.41, 1.6, expDecay(0.035)), 0.008, 0.34);
    writeWav('Void_Hit_a', normalize(declick(b), 0.74)); }
{   // Pure void hit: swish damage
    const b = bandpass(whiteNoise(0.15, attackDecay(0.012, 0.05)), (t) => 650 - t * 1800, 0.5);
    mix(b, tone(0.12, (t) => 280 - t * 700, expDecay(0.04)), 0, 0.3);
    writeWav('PureVoid_Hit_a', normalize(declick(b), 0.68)); }
{   // v59.8: Boss hit — same damage skeleton as the enemy hits above, but bigger/
    // deeper/with more low end to read as heavy plating on a massive hull rather
    // than a fighter-sized ship. Shared by every boss type when the player damages it.
    const b = metalDamage(560, 0.16, [[420, 0.22], [710, 0.1]]);
    mix(b, lowpass(whiteNoise(0.06, expDecay(0.025)), 220), 0, 0.55); // extra low thud for boss mass
    writeWav('Boss_Hit_a', normalize(declick(b), 0.78)); }

// ════════════════════════ DEATH EXPLOSIONS ════════════════════════
writeWav('Explosion_Small_a', normalize(declick(explosion(0.48, 0.72, 2)), 0.82));
writeWav('Explosion_Small_2_a', normalize(declick(explosion(0.52, 0.8, 2)), 0.82)); // variant for play-to-play variety
writeWav('Explosion_Medium_a', normalize(declick(explosion(0.8, 1.05, 3)), 0.85));
writeWav('Explosion_Big_a', normalize(declick(explosion(1.3, 1.5, 4)), 0.88));
{   // Void death: reverse swell into warbled boom
    const b = buf(0.85);
    mix(b, bandpass(whiteNoise(0.16, (t) => t / 0.16), 1100, 0.6), 0, 0.5); // pre-swell
    mix(b, fmTone(0.6, (t) => 160 - t * 110, 1.41, (t) => 2 + Math.sin(t * 90) * 1.2, expDecay(0.2)), 0.14, 1);
    mix(b, explosion(0.55, 1.0, 1), 0.14, 0.55);
    writeWav('Void_Death_a', normalize(declick(b), 0.85)); }
{   // Pure void death: airy implosive swish
    const b = buf(0.9);
    mix(b, bandpass(whiteNoise(0.3, (t) => Math.pow(t / 0.3, 1.6)), (t) => 500 + t * 2600, 0.5), 0, 0.8);
    mix(b, bandpass(whiteNoise(0.55, expDecay(0.2)), (t) => 1300 - t * 1700, 0.6), 0.3, 0.9);
    mix(b, tone(0.5, (t) => 420 - t * 640, expDecay(0.18)), 0.3, 0.5);
    writeWav('PureVoid_Death_a', normalize(declick(b), 0.8)); }
{   // Player death: big blast + descending power-down whine (the ship's systems
    // dying) + sputtering electrical tail. Matches the 3s shrapnel death animation.
    const b = buf(2.2);
    mix(b, explosion(1.5, 1.45, 4), 0, 1);                                   // main blast
    mix(b, lowpass(brownNoise(0.5, expDecay(0.16)), 110), 0, 0.8);           // sub thump
    for (let v = 0; v < 3; v++)                                              // power-down whine (detuned stack)
        mix(b, tone(1.6, (t) => (520 - t * 290) * (1 + (v - 1) * 0.013), attackDecay(0.05, 0.55), 'saw'), 0.25, 0.2);
    mix(b, ringmod(tone(1.2, (t) => 240 - t * 120, expDecay(0.4)), 33), 0.55, 0.3); // sputter tail
    writeWav('Player_Death_a', normalize(declick(b), 0.9)); }

// ════════════════════════ FLAME ════════════════════════
{   const b = buf(0.32);
    mix(b, lowpass(whiteNoise(0.3, swell(0.07, 0.05, 0.18, 0.3)), (t) => 900 + t * 3200), 0, 1);
    writeWav('Flame_Ignite_a', normalize(declick(b), 0.7)); }
{   // crackle: random impulses through a lowpass
    const b = buf(0.55);
    for (let i = 0; i < 46; i++) {
        const at = Math.random() * 0.5;
        mix(b, lowpass(whiteNoise(0.02, expDecay(0.005)), R(1200, 3800)), at, R(0.25, 0.8));
    }
    mix(b, lowpass(brownNoise(0.55, swell(0.05, 0.3, 0.2, 0.55)), 900), 0, 0.45);
    writeWav('Flame_Burn_a', normalize(declick(b), 0.62)); }

// ════════════════════════ LASERS (each family distinct) ════════════════════════
{   // Knight laser: thick saw-stack beam, powerful
    const b = buf(0.6);
    for (let v = 0; v < 3; v++) mix(b, tone(0.55, (t) => (880 - t * 700) * (1 + (v - 1) * 0.012), attackDecay(0.008, 0.2), 'saw'), 0, 0.4);
    mix(b, highpass(whiteNoise(0.5, expDecay(0.18)), 2600), 0, 0.25);
    mix(b, tone(0.45, 110, attackDecay(0.01, 0.16), 'sq'), 0, 0.3);
    writeWav('Knight_Laser_a', normalize(declick(softclip(b, 1.5)), 0.84)); }
{   // Knight advanced laser: wider stack, longer, more intense
    const b = buf(0.85);
    for (let v = 0; v < 5; v++) mix(b, tone(0.8, (t) => (1100 - t * 850) * (1 + (v - 2) * 0.011), attackDecay(0.008, 0.28), 'saw'), 0, 0.3);
    mix(b, tone(0.7, (t) => 80 - t * 20, attackDecay(0.01, 0.26), 'sq'), 0, 0.4);
    mix(b, highpass(whiteNoise(0.7, expDecay(0.24)), 2200), 0, 0.3);
    writeWav('Knight_Laser_Advanced_a', normalize(declick(softclip(b, 1.7)), 0.86)); }
{   // Void Master teleport beam: alien FM shriek + warble — very different character
    const b = buf(0.75);
    mix(b, fmTone(0.7, (t) => 1350 * Math.exp(-t * 2.2) + 240, 2.7, (t) => 2.5 + t * 3, attackDecay(0.01, 0.26)), 0, 1);
    mix(b, ringmod(tone(0.6, (t) => 500 - t * 300, attackDecay(0.02, 0.22)), 31), 0.05, 0.6);
    mix(b, bandpass(whiteNoise(0.5, swell(0.1, 0.1, 0.3, 0.5)), 2400, 0.4), 0.1, 0.3);
    writeWav('VoidMaster_Beam_a', normalize(declick(b), 0.84)); }
{   // Void asteroid layer laser: crystalline / glassy
    const b = buf(0.6);
    mix(b, tone(0.28, (t) => 650 + t * 6200, swell(0.05, 0.18, 0.05, 0.28)), 0, 0.45); // charge rise
    mix(b, tone(0.32, 2350, attackDecay(0.01, 0.12)), 0.27, 0.7);
    mix(b, tone(0.32, 2350 * 1.5, attackDecay(0.01, 0.09)), 0.27, 0.35);
    mix(b, fmTone(0.3, 1170, 3.01, 0.8, attackDecay(0.01, 0.1)), 0.27, 0.45);
    writeWav('VoidAsteroid_Laser_a', normalize(declick(b), 0.76)); }
{   // Laser-bomb warning: rising whine + ticks
    const b = buf(0.45);
    mix(b, tone(0.42, (t) => 420 + t * 2800, swell(0.03, 0.3, 0.1, 0.42), 'tri'), 0, 0.6);
    for (let i = 0; i < 6; i++) mix(b, highpass(whiteNoise(0.01, expDecay(0.003)), 3000), 0.05 + i * 0.065, 0.5);
    writeWav('LaserBomb_Warn_a', normalize(declick(b), 0.66)); }
{   // Laser-bomb fire: bright blast beam
    const b = buf(0.55);
    mix(b, highpass(whiteNoise(0.45, attackDecay(0.004, 0.16)), 1400), 0, 0.8);
    mix(b, tone(0.45, (t) => 210 - t * 120, attackDecay(0.005, 0.16), 'saw'), 0, 0.8);
    mix(b, tone(0.3, (t) => 95 - t * 40, expDecay(0.12)), 0, 0.5);
    writeWav('LaserBomb_Fire_a', normalize(declick(softclip(b, 1.5)), 0.85)); }
{   // Machine of the Void laser: stuttering industrial beam
    const b = tone(0.5, (t) => 320 - t * 220, (t) => attackDecay(0.005, 0.18)(t) * (Math.sin(t * 230) > -0.35 ? 1 : 0.15), 'sq');
    mix(b, fmTone(0.4, 480, 0.5, 1.8, expDecay(0.15)), 0.02, 0.4);
    writeWav('Machine_Laser_a', normalize(declick(b), 0.78)); }
{   // v59.8: Machine of the Void basic gun pattern (spread/barrage/cross/spiral/
    // wave/chaos) — short staggered double-gun industrial burst, distinct from
    // the sustained Machine_Laser beam above. Played once per attack cycle.
    const b = buf(0.14);
    mix(b, lowpass(whiteNoise(0.1, expDecay(0.03)), 1400), 0, 0.8);
    mix(b, tone(0.09, (t) => 260 - t * 900, expDecay(0.03), 'sq'), 0, 0.55);
    mix(b, tone(0.08, (t) => 180 - t * 500, expDecay(0.025), 'sq'), 0.02, 0.4); // second gun stagger
    writeWav('Machine_Shoot_a', normalize(declick(b), 0.78)); }
{   // Boss pattern shot: heavy energy burst, used by all boss types for pattern fire
    const b = buf(0.42);
    for (let v = 0; v < 3; v++) mix(b, tone(0.38, (t) => (760 - t * 580) * (1 + (v - 1) * 0.014), attackDecay(0.006, 0.17), 'saw'), 0, 0.38);
    mix(b, highpass(whiteNoise(0.33, expDecay(0.15)), 2000), 0, 0.28);
    mix(b, tone(0.35, 100, attackDecay(0.008, 0.14), 'sq'), 0, 0.35);
    writeWav('Boss_Pattern_Shot_a', normalize(declick(softclip(b, 1.4)), 0.82)); }

// ════════════════════════ BOSS ENGINE LOOPS (seamless) ════════════════════════
function engineLoop(name, build, sec = 4.5) {
    const raw = build(sec + 1.0);
    const looped = loopify(raw, 1.0);
    writeWav(name, normalize(looped, 0.62));
}
engineLoop('Boss_Engine_Mark1', (sec) => {
    // Mark I: heavy engine — rumble + 9Hz thrum
    const b = buf(sec);
    mix(b, lowpass(brownNoise(sec, 1), 300), 0, 1);
    mix(b, tone(sec, 55, (t) => 0.5 + 0.22 * Math.sin(2 * Math.PI * 9 * t), 'saw'), 0, 0.5);
    mix(b, tone(sec, 110, 0.18, 'tri'), 0, 0.4);
    return b;
});
engineLoop('Boss_Engine_Mark2', (sec) => {
    // Mark II: VERY heavy — deeper, slower thrum, more mass
    const b = buf(sec);
    mix(b, lowpass(brownNoise(sec, 1.2), 200), 0, 1.2);
    mix(b, tone(sec, 42, (t) => 0.55 + 0.3 * Math.sin(2 * Math.PI * 5.5 * t), 'saw'), 0, 0.6);
    mix(b, tone(sec, 38.6, 0.4, 'saw'), 0, 0.4); // detune growl
    mix(b, tone(sec, 84, (t) => 0.12 + 0.08 * Math.sin(2 * Math.PI * 5.5 * t + 1), 'sq'), 0, 0.3);
    return b;
});
engineLoop('Boss_Engine_Knight', (sec) => {
    // Knight: dark hovering presence — detuned hum cluster, slow swell
    const b = buf(sec);
    [110, 111.7, 164.8, 82.4].forEach((f, i) => {
        mix(b, tone(sec, f, (t) => 0.3 + 0.12 * Math.sin(2 * Math.PI * (0.5 + i * 0.13) * t + i * 2)), 0, 0.4);
    });
    mix(b, highpass(lowpass(whiteNoise(sec, 0.3), 1800), 700), 0, 0.18);
    return b;
});
engineLoop('Boss_Engine_Count', (sec) => {
    // The Count: breathing void presence
    const b = buf(sec);
    mix(b, lowpass(brownNoise(sec, (t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.45 * t)), 350), 0, 1);
    mix(b, tone(sec, 58, (t) => 0.35 + 0.1 * Math.sin(2 * Math.PI * 0.22 * t)), 0, 0.6);
    mix(b, bandpass(whiteNoise(sec, (t) => 0.25 + 0.2 * Math.sin(2 * Math.PI * 0.31 * t + 2)), 1300, 0.4), 0, 0.35);
    mix(b, ringmod(tone(sec, 196, 0.12), 3.1), 0, 0.5);
    return b;
}, 6);
engineLoop('Boss_Engine_Mark3', (sec) => {
    // Mark III Prototype: futuristic turbine — harmonic whine + fast pulse
    const b = buf(sec);
    [220, 330, 442].forEach((f, i) => mix(b, tone(sec, f + Math.sin(i) * 1.5, 0.22 - i * 0.05, 'tri'), 0, 0.6));
    mix(b, tone(sec, 1760, (t) => 0.05 + 0.025 * Math.sin(2 * Math.PI * 0.7 * t)), 0, 0.5);
    mix(b, lowpass(whiteNoise(sec, (t) => 0.3 + 0.1 * Math.sin(2 * Math.PI * 12 * t)), 900), 0, 0.5);
    mix(b, tone(sec, 70, (t) => 0.3 + 0.12 * Math.sin(2 * Math.PI * 12 * t), 'saw'), 0, 0.4);
    return b;
});
engineLoop('Boss_Engine_Machine', (sec) => {
    // Machine Of The Void: industrial machinery — rhythmic clank grid + hum
    const b = buf(sec);
    mix(b, tone(sec, 68, 0.4, 'sq'), 0, 0.35);
    mix(b, lowpass(brownNoise(sec, 0.8), 420), 0, 0.7);
    const step = 0.25; // 4Hz industrial grid
    for (let t0 = 0; t0 < sec; t0 += step) {
        if (Math.random() < 0.8) {
            mix(b, metalClank([[R(180, 260), 0.8], [R(400, 560), 0.4]], 0.1, false), t0 + R(-0.01, 0.01), R(0.25, 0.5));
        }
    }
    mix(b, ringmod(tone(sec, 137, 0.1), 2.3), 0, 0.4);
    return b;
}, 5);
engineLoop('Boss_Engine_Machine_Glitch', (sec) => {
    // Glitch overlay: faded in as the Machine's health drops
    const b = buf(sec);
    for (let i = 0; i < sec * 7; i++) {
        const at = Math.random() * sec;
        const kind = Math.random();
        if (kind < 0.4) mix(b, tone(R(0.02, 0.06), R(900, 3200), 0.8, 'sq'), at, 0.35); // digital blip
        else if (kind < 0.7) mix(b, highpass(whiteNoise(R(0.02, 0.05), 1), 2500), at, 0.4); // static burst
        else mix(b, ringmod(tone(R(0.04, 0.1), R(150, 400), 0.8, 'saw'), R(20, 70)), at, 0.4); // servo grind
    }
    return b;
}, 5);
engineLoop('Boss_Engine_Gatekeeper', (sec) => {
    // The Gatekeeper: ominous tearing void storm
    const b = buf(sec);
    mix(b, lowpass(brownNoise(sec, (t) => 0.9 + 0.3 * Math.sin(2 * Math.PI * 0.19 * t)), 240), 0, 1.2);
    mix(b, tone(sec, 36, 0.45), 0, 0.6);
    // tearing sweeps
    const sweeps = Math.floor(sec / 1.7);
    for (let s = 0; s < sweeps; s++) {
        const at = s * 1.7 + R(0, 0.4);
        mix(b, bandpass(whiteNoise(1.3, swell(0.4, 0.2, 0.7, 1.3)), (t) => 260 + t * 1700, 0.45), at, 0.5);
    }
    // distant shrieks
    for (let s = 0; s < Math.floor(sec / 2.6); s++) {
        const at = R(0.5, sec - 1);
        mix(b, fmTone(0.9, (t) => 700 - t * 350, 2.7, 1.6, swell(0.3, 0.1, 0.5, 0.9)), at, 0.16);
    }
    mix(b, ringmod(tone(sec, 92, 0.14), 0.9), 0, 0.5);
    return b;
}, 7);

// ════════════════════════ BOSS DEATHS ════════════════════════
{   // Long layered boss explosion — matches the 3s death animation
    const b = buf(3.1);
    mix(b, explosion(1.4, 1.5, 4), 0, 1);
    [0.5, 0.9, 1.3, 1.7, 2.1].forEach((at, i) => mix(b, explosion(0.7, R(0.8, 1.2), 2), at, 0.6 - i * 0.07));
    mix(b, lowpass(brownNoise(3.0, (t) => Math.max(0, 1 - t / 3)), 220), 0, 0.7);
    for (let i = 0; i < 10; i++) mix(b, highpass(whiteNoise(0.05, expDecay(0.015)), 2000), R(0.3, 2.6), 0.25);
    writeWav('Boss_Explosion_Long_a', normalize(declick(softclip(b, 1.3)), 0.88)); }
{   // Gatekeeper death: storm crescendo → collapse boom → tearing shriek → afterrumble
    const b = buf(3.2);
    mix(b, lowpass(brownNoise(0.9, (t) => Math.pow(t / 0.9, 1.4)), 500), 0, 0.9);
    mix(b, bandpass(whiteNoise(0.8, (t) => t / 0.8), (t) => 300 + t * 2400, 0.5), 0.1, 0.6);
    mix(b, explosion(1.6, 1.6, 3), 0.85, 1);
    mix(b, fmTone(1.1, (t) => 1300 * Math.exp(-t * 1.9) + 150, 2.7, 3, expDecay(0.4)), 0.9, 0.6);
    mix(b, ringmod(lowpass(brownNoise(1.8, expDecay(0.7)), 200), 1.2), 1.3, 0.8);
    writeWav('Gatekeeper_Death_a', normalize(declick(softclip(b, 1.3)), 0.88)); }

// ════════════════════════ BOSS SPECIAL ATTACKS ════════════════════════
{   // Mark II bomb deploy: heavy mechanical latch + two-tone klaxon — epic dread
    const b = buf(1.15);
    mix(b, metalClank([[120, 1], [195, 0.7], [310, 0.4]], 0.3, true), 0, 0.9); // latch thunk
    mix(b, lowpass(brownNoise(0.3, expDecay(0.1)), 300), 0, 0.6);
    [0, 0.42].forEach((at) => {
        mix(b, tone(0.2, 466, swell(0.02, 0.12, 0.06, 0.2), 'sq'), 0.25 + at, 0.3);
        mix(b, tone(0.2, 349, swell(0.02, 0.12, 0.06, 0.2), 'sq'), 0.45 + at, 0.3);
    });
    writeWav('Mark2_Bomb_Deploy_a', normalize(declick(b), 0.8)); }
{   // Mark II bomb explode: big boom + metallic ring + expanding wave whoosh
    const b = buf(1.2);
    mix(b, explosion(0.9, 1.4, 3), 0, 1);
    mix(b, metalClank([[523, 0.6], [741, 0.4], [988, 0.3]], 0.7, false), 0.05, 0.4);
    mix(b, bandpass(whiteNoise(0.8, swell(0.15, 0.1, 0.55, 0.8)), (t) => 500 + t * 1800, 0.5), 0.15, 0.5);
    writeWav('Mark2_Bomb_Explode_a', normalize(declick(softclip(b, 1.3)), 0.88)); }
{   // Knight teleport: reverse swell + void pop + sparkle
    const b = buf(0.45);
    mix(b, bandpass(whiteNoise(0.16, (t) => t / 0.16), 1300, 0.5), 0, 0.7);
    mix(b, fmTone(0.18, (t) => 600 - t * 1800, 1.41, 2, expDecay(0.05)), 0.15, 0.9);
    mix(b, bellNote(1568, 0.18, 1.3), 0.18, 0.3);
    writeWav('Knight_Teleport_a', normalize(declick(b), 0.72)); }
{   // Void blink (soldier/master teleports): smaller version
    const b = buf(0.3);
    mix(b, bandpass(whiteNoise(0.1, (t) => t / 0.1), 1500, 0.5), 0, 0.6);
    mix(b, fmTone(0.14, (t) => 520 - t * 1500, 1.41, 1.8, expDecay(0.04)), 0.09, 0.8);
    writeWav('Void_Blink_a', normalize(declick(b), 0.62)); }
{   // Count final attack charge: 2.8s rising dread
    const b = buf(2.9);
    mix(b, tone(2.8, (t) => 48 + t * 60, (t) => 0.4 + 0.3 * (t / 2.8)), 0, 0.8);
    mix(b, tone(2.8, (t) => 48.7 + t * 61, (t) => 0.3 + 0.25 * (t / 2.8)), 0, 0.6);
    mix(b, bandpass(whiteNoise(2.8, (t) => 0.15 + 0.65 * Math.pow(t / 2.8, 2)), (t) => 600 + t * 900, 0.5), 0, 0.6);
    // accelerating tremolo
    gain(b, (t) => 1 + 0.25 * Math.sin(2 * Math.PI * (2 + t * 4) * t));
    writeWav('Count_FinalCharge_a', normalize(declick(b), 0.74)); }
{   // Count final release: massive void burst
    const b = buf(1.3);
    mix(b, fmTone(0.9, (t) => 300 * Math.exp(-t * 3) + 60, 1.41, (t) => 3 + t * 2, attackDecay(0.004, 0.3)), 0, 1);
    mix(b, explosion(1.0, 1.3, 3), 0, 0.7);
    mix(b, ringmod(bandpass(whiteNoise(0.9, expDecay(0.3)), 1500, 0.5), 41), 0.05, 0.5);
    writeWav('Count_FinalRelease_a', normalize(declick(softclip(b, 1.4)), 0.88)); }
{   // Mark III cluster bomb launch: mechanical pop + falling whistle
    const b = buf(0.35);
    mix(b, lowpass(whiteNoise(0.06, expDecay(0.02)), 1200), 0, 0.9);
    mix(b, tone(0.3, (t) => 900 - t * 1400, attackDecay(0.02, 0.12), 'tri'), 0.04, 0.45);
    writeWav('Cluster_Launch_a', normalize(declick(b), 0.68)); }
{   // Cluster explode: popcorn triple burst
    const b = buf(0.55);
    [0, 0.07, 0.16].forEach((at, i) => mix(b, explosion(0.3, 0.7, 0), at, 0.8 - i * 0.15));
    writeWav('Cluster_Explode_a', normalize(declick(b), 0.8)); }
{   // Mark III self-destruct alarm: klaxon ×3
    const b = buf(1.5);
    for (let i = 0; i < 3; i++) {
        mix(b, tone(0.22, 622, swell(0.01, 0.16, 0.05, 0.22), 'sq'), i * 0.46, 0.4);
        mix(b, tone(0.22, 466, swell(0.01, 0.16, 0.05, 0.22), 'sq'), i * 0.46 + 0.23, 0.4);
    }
    mix(b, lowpass(brownNoise(1.45, 0.3), 250), 0, 0.5);
    writeWav('SelfDestruct_Alarm_a', normalize(declick(b), 0.72)); }
{   // Machine black hole: deep implosive drone
    const b = buf(1.7);
    mix(b, tone(1.5, (t) => 210 * Math.exp(-t * 1.8) + 28, swell(0.1, 0.8, 0.6, 1.5)), 0, 1);
    mix(b, bandpass(whiteNoise(0.7, (t) => Math.pow(t / 0.7, 1.7)), (t) => 2400 - t * 2800, 0.5), 0, 0.6);
    mix(b, tone(1.2, 30, (t) => (Math.sin(2 * Math.PI * 7 * t) > 0.3 ? 0.7 : 0.2) * swell(0.1, 0.6, 0.5, 1.2)), 0.3, 0.6);
    writeWav('Machine_BlackHole_a', normalize(declick(b), 0.84)); }

// ════════════════════════ MISC ════════════════════════
{   // Asteroid break: rocky crumble
    const b = buf(0.5);
    mix(b, lowpass(whiteNoise(0.1, expDecay(0.03)), 800), 0, 0.9);
    mix(b, tone(0.2, (t) => 130 - t * 200, expDecay(0.06)), 0, 0.6);
    for (let i = 0; i < 9; i++) mix(b, lowpass(whiteNoise(0.025, expDecay(0.007)), R(700, 2200)), R(0.03, 0.35), R(0.3, 0.6));
    writeWav('Asteroid_Break_a', normalize(declick(b), 0.74)); }

// ════════════════════════ TOOLKIT DEMOS (v59.9 diversity pass) ════════════════════════
// Preview-only WAVs for the new primitives/composites above. They're written to a
// separate folder and use names that don't appear in sfxList, so the game never
// loads them — delete the folder anytime, or regenerate just these with
// ONLY_SFX=Toolkit_Demo node tools/generate_sfx.js
const DEMO_OUT = path.join(__dirname, '..', 'assets', 'sfx', '_toolkit_demos');
console.log('Generating toolkit demos into ' + DEMO_OUT);

writeWav('Toolkit_Demo_PinkNoise', normalize(declick(pinkNoise(1.2, swell(0.3, 0.3, 0.6, 1.2))), 0.7), DEMO_OUT);

writeWav('Toolkit_Demo_ResonantSweep', normalize(declick(
    resonantFilter(whiteNoise(1.2, 0.9), (t) => 200 + t * 3000, 3.2, 'band')
), 0.75), DEMO_OUT);

{   const b = detunedUnison(0.9, 220, attackDecay(0.02, 0.5), 'saw', 5, 20);
    writeWav('Toolkit_Demo_Chorus', normalize(declick(chorus(b, 10, 0.7, 0.6)), 0.75), DEMO_OUT); }

writeWav('Toolkit_Demo_Tremolo', normalize(declick(
    tremolo(tone(1.2, 300, attackDecay(0.02, 0.9)), 7, 0.8)
), 0.7), DEMO_OUT);

writeWav('Toolkit_Demo_Foldback', normalize(declick(
    foldback(tone(0.6, (t) => 220 + t * 200, attackDecay(0.01, 0.4), 'sin'), 0.35)
), 0.7), DEMO_OUT);

writeWav('Toolkit_Demo_Bitcrush', normalize(declick(
    bitcrush(tone(0.6, (t) => 300 - t * 150, attackDecay(0.01, 0.4)), 4, 8)
), 0.7), DEMO_OUT);

writeWav('Toolkit_Demo_PWM', normalize(declick(
    pwm(0.9, 180, (t) => 0.1 + 0.4 * (0.5 + 0.5 * Math.sin(t * 6)), attackDecay(0.02, 0.6))
), 0.7), DEMO_OUT);

writeWav('Toolkit_Demo_Unison', normalize(declick(
    detunedUnison(0.8, 165, attackDecay(0.02, 0.5), 'saw', 7, 24)
), 0.75), DEMO_OUT);

writeWav('Toolkit_Demo_Pluck', normalize(declick(pluck(220, 1.5, 0.997)), 0.75), DEMO_OUT);

writeWav('Toolkit_Demo_Echo', normalize(declick(
    echo(tone(0.05, 900, expDecay(0.02)), 0.14, 0.5, 4)
), 0.75), DEMO_OUT);

writeWav('Toolkit_Demo_Stutter', normalize(declick(
    stutter(tone(1.0, (t) => 260 + t * 120, attackDecay(0.02, 0.8)), 22, 0.4, 2)
), 0.75), DEMO_OUT);

writeWav('Toolkit_Demo_Morph', normalize(declick(
    morph(metalDamage(900, 0.5), fmTone(0.5, 360, 1.41, 1.8, expDecay(0.2)), (t) => t / 0.5)
), 0.75), DEMO_OUT);

writeWav('Toolkit_Demo_StringPing', normalize(declick(stringPing(330, 1.0, 0.997)), 0.78), DEMO_OUT);
writeWav('Toolkit_Demo_WindSwell', normalize(declick(windSwell(1.4, 300, 2400)), 0.72), DEMO_OUT);
writeWav('Toolkit_Demo_AlienScreech', normalize(declick(alienScreech(0.7, 500, 3.2)), 0.8), DEMO_OUT);
writeWav('Toolkit_Demo_DigitalGlitch', normalize(declick(digitalGlitch(0.9, 0.45)), 0.75), DEMO_OUT);

if (failedWrites.length) {
    console.log('Done with ' + failedWrites.length + ' FAILURE(S) after retries: ' + failedWrites.join(', '));
    console.log('  -> re-run with ONLY_SFX=<name> to retry just those once whatever was locking them clears.');
    process.exitCode = 1;
} else {
    console.log('Done. ' + writtenCount + ' sound' + (writtenCount === 1 ? '' : 's') + ' written.');
}

