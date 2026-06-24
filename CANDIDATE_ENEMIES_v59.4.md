# Candidate Enemies — v59.4 (Sandbox Testing)
**Date:** June 11, 2026
**Status:** Implemented for sandbox evaluation only — NOT added to level spawn pools or the Enemy Guide.
Spawn them from the Sandbox Console (backtick `` ` ``) — they're the `★`-prefixed buttons on the last pages.

Each was designed to fit its class identity while introducing a mechanic the game doesn't have yet.

---

## Controlled Human (conventional tech, orange)

### ★ Aegis Phalanx (`aegis`) — 90 HP, 40 pts
**Mechanic: directional shield with vent windows.**
Projects a frontal arc shield that **blocks all player fire rising from below** (sparks bounce off).
Cycles: 3 s shielded → 1.5 s vented (glowing core exposed = vulnerable cue). Only fires while shielded.
**Counterplay:** wait for the vent, or use tracking bullets that dive onto it from above (`bullet.speedY > 0` pierces).
*Tuning knobs:* cycle times (180/90 frames), shield-while-vented behaviour.

### ★ Minelayer (`minelayer`) — 70 HP, 35 pts
**Mechanic: area denial.**
Descends to a band near the top, then sweeps horizontally laying proximity mines (~1.6 s apart).
Mines arm after 0.5 s, blink faster near timeout, and burst into a 6-bullet ring when the player
comes within 70 px or after 6 s.
**Counterplay:** kill the layer fast; mines can also be shot? — no, mines are bullets (untargetable); avoid their radius.
*Tuning knobs:* mine fuse (360), proximity (70 px), ring damage (30).

### ★ Breacher (`breacher`) — 55 HP, 30 pts
**Mechanic: telegraphed ram dash.**
Cruises down slowly, then: 0.6 s **windup** (shakes, nose glows red — aim locks at windup start)
→ fast dash at the locked position → slow recovery → repeat.
**Counterplay:** the aim locks before the dash, so moving during the windup always dodges it.
*Tuning knobs:* windup 36 frames, dash speed 9, collision damage (currently default 30 — could be raised for ram identity).

---

## Void Corrupted (purple, reality-warping)

### ★ Void Phantom (`void_phantom`) — 45 HP, 35 pts
**Mechanic: phase-shift invulnerability windows.**
Cycle: visible 2.2 s → fades → **phased 1.6 s** (15% alpha, bullets pass straight through, can't be rammed,
drifts toward your column) → materialises and instantly fires a 3-bullet aimed fan (eye glows as the telegraph).
**Counterplay:** burst it down during visibility windows; don't waste shots while it's a ghost.
*Tuning knobs:* phase durations (130/24/95/24 frames), fan damage 42.

### ★ Void Leech (`void_leech`) — 80 HP, 45 pts
**Mechanic: drain that heals the enemy.**
Every 3.2 s launches a slow, weakly-homing pink orb (escapable; 5 s life). If it hits you:
normal damage + **3 s health drain**, and the leech **heals 30 HP** with a visible pink feed glow.
**Counterplay:** it's a priority target — ignoring it makes it effectively much tankier.
*Tuning knobs:* orb steering (0.04), heal amount (30), orb speed (2.2).

### ★ Void Splitter (`void_splitter`) — 100 HP, 30 pts (+10 ×2)
**Mechanic: splits on death.**
Wobbling blob with two visible inner cores. Killed by bullets → splits into 2 fast splitterlings
flung sideways (one generation only; they don't split again). Ramming it does NOT trigger the split.
**Counterplay:** kill it high so you have room to handle the children.
*Tuning knobs:* splitterling HP (35) / speed (2.2) / scatter impulse.

---

## Defender (red, precise military)

### ★ Railgun Lancer (`defender_railgunner`) — 85 HP, 50 pts
**Mechanic: column denial.**
Settles into the top band, strafes to align with your column (2 s), muzzle flickers while locking,
then fires a **full-screen vertical railgun** (reuses the Mark III warning-line + beam system).
Holds still while firing so the lane stays honest.
**Counterplay:** sidestep during the dashed warning; punish it while it's locked in place.
*Tuning knobs:* align time (120), cooldown (130–190), beam damage (60, from `fireLaserBeam`).

### ★ Ace Interceptor (`defender_ace`) — 60 HP, 45 pts
**Mechanic: it dodges your bullets.**
Watches for player bullets approaching within 150 px of its nose and performs a fast afterburner
sidestep (with bank animation + contrail), on a 0.9 s cooldown. Fires tight 2-shot aimed bursts.
**Counterplay:** spread fire (high firepower), tracking bullets, or bait the dodge then fire into the sidestep.
*Tuning knobs:* dodge cooldown (55), detection box (26 px wide × 150 px), dodge distance (8 px × 8 frames).

### ★ Skyfall Bomber (`defender_bomber`) — 120 HP, 55 pts
**Mechanic: altitude-fused flak.**
Lobs shells that **detonate at the altitude you occupied at launch**, bursting into a 4-fragment X.
**Counterplay:** keep changing altitude; sitting at one height turns the screen into flak lanes.
*Tuning knobs:* shell rate (2800 ms), fragment damage (28), fragment count (4).

---

## Void Pure (deep purple constructs)

### ★ Void Rift (`void_rift`) — 140 HP, 60 pts
**Mechanic: gravity well.**
A near-stationary tear in space that **gently pulls you toward it** within 260 px (a faint dashed
ring shows the influence radius; pull strength rises near the centre but is always escapable).
Emits slow rotating 4-bullet void rings. Dies with an inward implosion.
**Counterplay:** fight the pull or kill it from outside the radius.
*Tuning knobs:* pull strength (0.45 max), radius (260), ring rate (2600 ms).

### ★ Void Conduits (`void_conduit`) — 65 HP each, 40 pts each
**Mechanic: paired beam geometry.**
Always spawns as a **linked pair** with a damaging void beam strung between them. They sweep in
opposite phase so the beam constantly changes angle, slicing the playfield. Killing either node
drops the beam — but the survivor **enrages** (red shift, fires void shots twice as fast).
**Counterplay:** pick which problem you want: cross the beam carefully and burst one node, then
deal with an angry survivor.
*Tuning knobs:* beam damage (25 / 0.75 s), sweep speed (0.016), enraged fire rate (1100 ms).

### ★ Void Echo (`void_echo`) — 75 HP, 45 pts
**Mechanic: your own ship, turned against you.**
A glitching void copy of the player's ship that hovers in the top band and **mirrors your horizontal
position from one second ago** — and it **fires only when you fire**, dropping a void bolt from where
you just were. Trigger discipline and unpredictable movement beat it; spraying while strafing
predictably feeds it a firing solution.
**Counterplay:** keep moving laterally and it always shoots where you were, not where you are.
*Tuning knobs:* echo delay (60 frames), fire rate cap (27 frames), bolt damage (38).

---

## Implementation notes
- All candidates live behind clearly-marked `v59.4` blocks: templates in `enemyTypes`, behaviours in
  `updateEnemies`, attacks in `shootCandidatePattern()`, visuals in `drawCandidateEnemy()`,
  special bullets (mine / leech orb / flak shell) in `updateBullets` + `drawEnemyBullets`,
  death behaviours in `handleEnemyDeath`.
- None are in level spawn pools, the Enemy Guide, or checkpoint logic — promoting one to the real
  game means: add it to the level's `spawnEnemy` pool, the Enemy Guide array, and (optionally) a sound set.
- `void_splitterling` is an internal type (spawned by the splitter's death) with no sandbox button.
- Minelayer / Railgunner / Echo deliberately never leave the screen — fine for sandbox; they'd need
  a departure behaviour if promoted.
