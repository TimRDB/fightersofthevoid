# Sound Design — v59.5 Procedural Soundscape
**Date:** June 11, 2026
**Generator:** `tools/generate_sfx.js` → run `node tools/generate_sfx.js` to (re)build all WAVs into `assets/sfx/`
**Note:** regenerating overwrites the 62 generated names in `assets/sfx/` (your own files with other names are untouched).
**62 sounds, ~6.5 MB.** All synthesized (oscillators, FM, filtered noise, envelopes) — tweak any recipe in the generator and re-run; the game picks up new files automatically.

## Class sound signatures
| Class | Signature |
|---|---|
| **Controlled Human** | Grounded & realistic: noise-burst gun pews, metallic clanks, classic explosions |
| **Void Corrupted** | Same skeletons, warped: FM warble shots, ring-modulated clanks, implosive warble deaths |
| **Defender** | Futuristic but real: clean fast square-sweep zaps, synthetic clank hits |
| **Void Pure** | Otherworldly: no hard attacks — swishes, swells, emanations |
| Void bullets | Energy (FM) vs. regular bullets (ballistic noise) throughout |

## What plays when
**Powerups** — 8 unique pickups in a shared bell-chime family (`Powerup_*`), wired in `applyPowerup`.

**Player weapons** — main cannon keeps the embedded data-URI sound with its existing volley stagger; tracking gun (`Player_Shoot_Tracking`) and curved gun (`Player_Shoot_Curved`) now fire one sound per gun, staggered 14–16 ms per extra gun. Laser pickup attack → `Player_Laser`; lance → `Player_Lance`; tracking/curved overflow bursts → `Player_Overflow_Burst` (also reused, pitched down, as the shield-max shockwave).

**Enemy shooting** — `playEnemyShootSound(enemy)` runs after every pattern: class signature + per-type variants (sniper crack, heavy thud, drone chirp, void sniper, defender heavy). Pitch scales with enemy size.

**Hits (non-lethal)** — `playControlledHumanHitSound(enemy, false)`: Metal_Hit/Metal_Hit_2 (human), Void_Hit (warped clank), Defender_Hit (synthetic clank), PureVoid_Hit (swish). Pitch deepens with enemy size **and sags as health drops**.

**Deaths** — centralized in `createDeathExplosion(x, y, enemyType)` so every kill path (bullets, tracking, ramming) sounds: Explosion_Small/Medium/Big chosen by max health, pitched by size; Void classes get `Void_Death` / `PureVoid_Death`. The old procedural WebAudio explosion/impact functions are superseded (left in place, unused).

**Flame** — `Flame_Ignite` when a regular++ round becomes flame; `Flame_Burn` whenever a Regular+/flame hit applies the health drain.

**Lasers (each family distinct)** — Knight `Knight_Laser` / `Knight_Laser_Advanced` (thicker, longer, more intense); Void Master teleport beam `VoidMaster_Beam` (alien FM shriek — deliberately unlike the Knight); void asteroid layer `VoidAsteroid_Laser` (crystalline charge + beam, fires at charge start); Mark III / Machine / Railgunner beams `LaserBomb_Warn` → `LaserBomb_Fire` (wired inside `fireLaserBeam`); Machine turret `Machine_Laser` (stuttering industrial).

**Boss engines** — `updateBossEngine()` (called first thing in `gameLoop`, before any early return) runs a looping ambience per boss that **fades in with the entrance approach** and cuts out on death/clear:
| Boss | Loop | Character |
|---|---|---|
| Mark I | `Boss_Engine_Mark1` | heavy engine, 9 Hz thrum |
| The Knight | `Boss_Engine_Knight` | dark detuned hover-hum |
| Mark II | `Boss_Engine_Mark2` | VERY heavy — deeper, slower, more mass |
| The Count | `Boss_Engine_Count` | breathing void presence |
| Mark III | `Boss_Engine_Mark3` | futuristic turbine whine |
| Machine Of The Void | `Boss_Engine_Machine` + `_Glitch` overlay | industrial clank grid; **glitch overlay volume rises as health falls** |
| The Gatekeeper | `Boss_Engine_Gatekeeper` | ominous tearing void storm with distant shrieks |

**Boss deaths** — `Boss_Explosion_Long` (3.1 s, matches the death animation) in `handleBossDeath` and the sandbox clear button; the Gatekeeper gets `Gatekeeper_Death` (storm crescendo → collapse → tearing shriek).

**Boss specials** — Mark II bomb: `Mark2_Bomb_Deploy` (latch + klaxon) / `Mark2_Bomb_Explode`; Knight teleport `Knight_Teleport`; Void Soldier teleport `Void_Blink`; Count final attack `Count_FinalCharge` (2.9 s rising dread) → `Count_FinalRelease`; Mark III `Cluster_Launch`/`Cluster_Explode`/`SelfDestruct_Alarm`; Machine `Machine_BlackHole`. Asteroid destruction → `Asteroid_Break`.

## Kept from your originals
`Player_Shoot_Normal` + `Player_Hit_Normal` (embedded data URIs, zero-latency), `Player_Shield_Hit`, `Player_Shield_Deplete`, `Protector_Shield_Hit`, `Protector_Recharge`. Your old `Enemy_Normal_Hit/Hit_2/Impact.wav` remain on disk unregistered; your original shoot sound was backed up as `Enemy_Normal_Shoot_original.wav` (the registered `Enemy_Normal_Shoot.wav` is now the generated one).

## v59.5b revision (realism pass)
- **Explosions** rebuilt noise-dominant: banded thud transient + brown-noise body + noise whump
  (the old tonal sub "ping" made small deaths sound dingy); tonal sub only on big blasts.
  Small-enemy death pitch-up capped at 1.06× (was 1.25×) and a second small variant
  (`Explosion_Small_2`) is picked at random for play-to-play variety.
- **Hits** rebuilt as *metal being damaged* (`metalDamage()` in the generator: noise thunk +
  flickering scrape + very faint resonance) instead of bell-partial clanks. Pitch is now nearly
  constant (rate jitter 0.03, health-pitch ramp ±6%); realism comes from **randomized intensity**
  (volume jitter 0.16–0.22 across hits, deaths and shots).
- **Powerups** softened: lowpassed near-pure sines (`softChime`), fewer/quieter notes, pickup
  volume 0.72 → 0.55.

## Tuning
- Per-event volume/pitch: edit the `playSfxVariant(name, vol, volJitter, rateJitter, delayMs, rate)` call at the wiring site.
- Sound character: edit its recipe in `tools/generate_sfx.js`, re-run — no game-code change needed.
- Engine loudness: `BOSS_ENGINE_DEFS[type].vol`.
- Dormant placeholders left as silent no-ops: `boss_appear`, `level_up`, `player_death`, `impact`, `explode`, `lance_fire`, `overflow_fire` (superseded or never wired; harmless).
- Long sounds use 2-element pools instead of 6 (`LONG_SFX` set in `loadAllAudio`).
