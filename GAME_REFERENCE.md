# Fighters Of The Void — Complete Game Reference
> Source: `Fighters Of The Void v59.html`  
> All values extracted directly from game code.

---

## Table of Contents
1. [Player Stats](#1-player-stats)
2. [Player Weapons](#2-player-weapons)
3. [Enemies](#3-enemies)
4. [Bosses](#4-bosses)
5. [Bullet Types](#5-bullet-types)

---

## 1. Player Stats

| Stat | Value |
|---|---|
| Starting Health | 100 |
| Max Health (upgraded) | 200 |
| Max Shield | 50 |
| Speed | 5 |
| Hit Box | 30×30 |

---

## 2. Player Weapons

### Normal Bullet
- Size: 4×10
- Speed: 8 (straight up)
- Damage: 25
- Visual: Cyan rectangle; turns orange during Rapid Fire powerup

### Tracking Bullet
- Size: 6×6
- Speed: 6, then steers toward nearest enemy
- Damage: 20
- Life: 180 frames (3 seconds)
- Tracking strength: 0.15 (15% direction correction per frame)
- Visual: Purple circle with white core and soft glow

### Tracking Overflow Bullet *(tracking gun at max capacity)*
- Size: 8×8
- Speed: 6 (tracks)
- Damage: 75
- Life: 300 frames (5 seconds)
- Tracking strength: 0.20
- Explodes into more tracking bullets (damage 75 each) at 30% screen height or after 200px travel
- Visual: Pulsing magenta/pink circle with bright white core

---

## 3. Enemies

| Enemy | Health | Size | Speed | Shoot Rate | Pattern | Bullet Damage |
|---|---|---|---|---|---|---|
| Basic | 30 | 25×25 | 2 | 1500 ms | Single (straight down) | 40 |
| Fast | 20 | 20×20 | 4 | 1000 ms | Single (straight down) | 40 |
| Heavy | 80 | 40×40 | 1 | 2000 ms | Triple (3 bullets, spread across 40px) | 35 each |
| Zigzag | 40 | 30×30 | 2.5 | 1200 ms | Spread (5 bullets angled –2 to +2) | 28 each |
| Sniper | 35 | 25×35 | 1.5 | 2500 ms | Aimed (directly at player, speed 4) | 45 |
| Elite | 200 | 50×45 | 1.5 | 1800 ms | Elite burst: 60% → 3-shot aimed burst; 40% → 8-bullet spiral | 55 (burst) / 48 (spiral) |
| Drone | 15 | 15×15 | 3.5 | 800 ms | Single aimed (speed 4) — `isDroneBullet` | 65 |
| Dreadnought | 750 | 120×80 | 0.5 | 700 ms | Turret aimed (speed 5) + spawns fighters/drones every 4 s | 60 |
| Void Soldier | 35 | 32×45 | 3 | 1100 ms | Void dual cone (2 void bullets in 50° cone); 10% variant fires void parallel (2 aimed bullets) | 70 (cone) / 75 (parallel) |
| Void Sniper | 60 | 26×38 | 1 | 733 ms | Void sniper shot (single aimed void bullet, speed 5) | 80 |
| Void Warrior | 120 | 80×50 | 1.5 | 1800 ms | 4 teleport void bullets — 2 from left body (left-down quadrant), 2 from right body (right-down quadrant); each teleports after 20–35 frames | 45 each (capped) |
| Asteroid Layer | 400 | 88×55 | 0.8 | 4000 ms | Asteroid spread — launches 3–5 large asteroid projectiles | varies |

### Enemy Notes
- **Void Soldier** can teleport randomly (0.2% chance per frame, 0 cooldown in v59).
- **Dreadnought** takes spawned fighters/drones and fires from a turret at the top.
- **Void Warrior** has two separate bodies on either side; shoots from both simultaneously.
- **Asteroid Layer** launches asteroids that arc back up the screen, not `enemyBullets`.

---

## 4. Bosses

All bosses share the same phase threshold system:
- **Phase 1**: >66% health
- **Phase 2**: 33–66% health
- **Phase 3**: <33% health (or <15% for Mark III which triggers self-destruct)

---

### Boss 1 — Mark I Destroyer (Level 1)
| Stat | Value |
|---|---|
| Health | 5,000 |
| Size | 120×80 |
| Speed | 2 |
| Shoot Rate | Ph1: 800 ms · Ph2: 500 ms · Ph3: 300 ms |
| Pattern Cycle | Every 60 frames (1 second), rotates through 4 patterns |
| Bullet Type | Standard (no flag) — red rectangle |

**Attack Patterns** (`shootBossPattern`):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Straight Barrage | 3 bullets straight down from bottom guns | 48 |
| 1 | Circular Spread | 8-directional burst from central machine | 42 |
| 2 | Aimed Shots | Every 4th gun across all machines fires at player | 55 |
| 3 | Spiral | Central guns rotate in a spiral (time-based angle) | 44 |

---

### Boss 2 — The Knight (Level 2)
| Stat | Value |
|---|---|
| Health | 7,500 |
| Size | 140×100 |
| Speed | 1.8 |
| Shoot Rate | Ph1: 800 ms · Ph2: 500 ms · Ph3: 300 ms |
| Pattern Cycle | Rotates through 5 patterns |
| Bullet Type | `isKnightBullet` — red rectangle (no dedicated draw branch) |

**Special Mechanics:**
- Hovering: oscillates vertically with a sin wave
- **Teleportation** (phases 2–3): teleports to random position on a timer
- **Energy Shield** (phase 3 only): periodically becomes invulnerable
- **Laser Fire** (phase 2+): charges up, then fires `isLaser` or `isAdvancedLaser`
  - Phase 2: 40% chance of advanced laser
  - Phase 3: always advanced laser
  - Advanced laser fires `isLaserPulse` energy orbs at the tip of each beam

**Knight Bullet Patterns** (`shootKnightPattern`):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Enhanced Barrage | 7 bullets spread across 120px, angled | 55 |
| 1 | Double Spiral | 2 counter-rotating spirals × 8 bullets each | 48 |
| 2 | Tracking Burst | 5 bullets aimed at player with spread | 62 |
| 3 | Cross Formation | 8 directions (cardinal + diagonal) | 52 |
| 4 | Pulse Wave | 3 rings (6, 8, 10 bullets) fired with 200 ms delay each | 44 |

**Laser Damages:**
| Type | Damage | Speed | Life |
|---|---|---|---|
| Regular Laser (`isLaser`) | 95 | 15 | 60 frames |
| Advanced Laser (`isAdvancedLaser`) | 120 | 18 | 75 frames |
| Laser Pulse (`isLaserPulse`) | 150 | 9 | 90 frames |

---

### Boss 3 — Mark II Destroyer (Level 3)
| Stat | Value |
|---|---|
| Health | 12,000 |
| Size | 390×145 |
| Speed | 1.5 |
| Shoot Rate | Ph1: 450 ms · Ph2: 300 ms · Ph3: 200 ms |
| Pattern Cycle | Rotates through 5 patterns |
| Bullet Type | Standard or `isRegularPlus` (30% chance per shot) |

**Special Mechanics:**
- **Bomb** (≤50% health): Drops a bomb; after a 5-count countdown it explodes and fires a wave of `isBombBullet` in all directions. Cycle repeats every ~3 seconds.
- Bomb bullets can also have `isRegularPlus` set.

**Mark II Bullet Patterns** (`shootDestroyer2Pattern`):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Enhanced Barrage | 7 bullets down; 30% chance each is `isRegularPlus` | 65 (reg+) / 52 (standard) |
| 1 | Massive Circular Spread | Large circular burst; 25% chance `isRegularPlus` | varies |
| 2 | Aimed Burst | Multiple aimed shots toward player | varies |
| 3 | Cross Pattern | Bullets fired in cross formation | varies |
| 4 | Wave Sweep | Sweeping bullet pattern | varies |

---

### Boss 4 — The Count (Level 4)
| Stat | Value |
|---|---|
| Health | 15,000 |
| Size | 240×175 |
| Speed | 1.2 |
| Shoot Rate | Ph1: 240 ms burst + 3000 ms pause · Ph2: 180 ms + 2400 ms pause · Ph3: 120 ms + 1800 ms pause |
| Complex Attack Rate | Ph1: every 4800 ms · Ph2: every 3600 ms · Ph3: every 2400 ms |
| Bullet Type | `isVoidBullet`, many with `isFastVoid`, some with `isTeleportBullet` |

**Special Mechanics:**
- Void core rotates; rotation speed increases as health drops (max 0.15 rad/frame)
- **Final Attack** (≤25% health): 3-second charge, then fires 60+ `isFinalAttackBullet` teleport void bullets from all screen edges. Damage: 55 each.
- No shooting during final attack charge

**Void Bullet Patterns** (`shootCountPattern`):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Void Pulse Rings | 3 concentric rings (8/12/16 bullets); every 3rd is fast; innermost ring: every 6th teleports | 35 |
| 1 | Converging Void Streams | 7 streams × 4 bullets per stream; outer bullets fast; every 3rd stream: 2 middle bullets teleport | 38 |
| 2 | Void Spiral Maze | 4 spiral arms × 7 bullets; every 4th fast; arm 0 final bullets teleport | 32 |
| 3 | Void Wave Burst | 14 bullets in full ring; alternating fast/slow; every 8th teleports | 42 |

**Complex Attacks** (`executeCountComplexAttack`):
| # | Name | Description |
|---|---|---|
| 0 | Orbital Void Mines | 3 orbits (5/7/9 mines); outer orbit: every 4th teleports; damage 45 |
| 1 | Void Pulse Wave | 4 delayed pulses × 14 bullets; final pulse: every 6th teleports; damage 38 |
| 2 | Void Fractal Burst | Fractal depth = current phase; deepest level every 4th sub-branch teleports; damage 35–45 |

---

### Boss 5 — Mark III Destroyer Prototype (Level 5)
| Stat | Value |
|---|---|
| Health | 20,000 |
| Size | 200×150 |
| Speed | 1.6 |
| Shoot Rate | Ph1: 450 ms · Ph2: 300 ms · Ph3: 200 ms |
| Cluster Bomb Rate | Ph1: 4000 ms · Ph2: 3200 ms · Ph3: 2500 ms |
| Laser Bomb Rate | Ph1: 8000 ms · Ph2: 6500 ms · Ph3: 5000 ms |
| Complex Cluster Rate | Ph2: 6400 ms · Ph3: 4800 ms |
| Bullet Type | `isMarkIIIBullet`, `isMissile`, `isClusterBullet`, `isSelfDestructBullet` |

**Phases:**
- >66% = Phase 1, 33–66% = Phase 2, 15–33% = Phase 3
- **≤15% health** = SELF-DESTRUCT: 5-second countdown fires a massive burst of `isSelfDestructBullet` (damage 40–50); this replaces all other attacks

**Main Bullet Patterns** (`shootMarkIIIPattern`):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Straight Barrage | 3 bullets straight down | 50 |
| 1 | Diagonal Cross | 4 diagonal directions × 3 bullets each | 45 |
| 2 | Missile Barrage | 3 `isMissile` aimed at player | 60 |
| 3 | Gun Turret Spray | 2 wing turrets × 3 bullets in slight spread | 40 |
| 4 | Converging Lines | 3 lines from top of screen aimed at boss position | 45 |
| 5 | Asymmetric Fire | Left cannon (3 bullets, damage 50) + right cannon (2 bullets, damage 45) | 45–50 |

**Bomb Attacks:**
- **Cluster Bomb**: drops from boss, travels down, then explodes into `isClusterBullet` in all directions (damage 35 each)
- **Laser Bomb**: drops from boss, then fires `isLaserWarning` (yellow dashed guidance line, 20 frames) followed by `isLaserBeam` (screen-spanning orange/white beam, damage 60, 25 frames)

---

### Boss 6 — Machine Of The Void (Level 6 — Final Boss)
| Stat | Value |
|---|---|
| Health | 30,000 |
| Size | ~90% screen width × ~40% screen height |
| Speed | 0.5 |
| Starting Void Corruption | 10% (grows to 100% over battle) |
| Starting Void Bullet Chance | 20% |
| Starting Regular+ Chance | 30% |
| Bullet Types | `isVoidBullet` (dmg 85), `isRegularPlus` (dmg 65), standard (dmg 50) |

**Special Mechanics:**
- Void corruption increases as health drops, making bullets more chaotic (movement randomness grows)
- **Laser Turret**: rotating turret fires `isLaserBullet` (orange rectangle, fades over 60 frames)
- **Laser Bomb Attack**: fires `isLaserWarning` then `isLaserBeam` (same as Mark III)
- **Black Hole Phase**: special phase where the boss creates a black hole effect on screen
- Three linked machine components (central + left + right) all fire simultaneously

**Machine Bullet Patterns** (`fireMachinePattern`, dispatched by `shootBossPattern` structure):
| # | Name | Description | Damage |
|---|---|---|---|
| 0 | Straight Barrage | 3 bottom guns fire straight down | 48 |
| 1 | Circular Spread | 8 guns fire in all directions from central machine | 42 |
| 2 | Aimed Shots | Every 4th gun across all machines fires at player | 55 |
| 3 | Spiral | Central guns fire in a rotating spiral pattern | 44 |

*Phases 1 and 2 use patterns 0–1 and 0–2 respectively. Phase 3 uses all 4.*

---

## 5. Bullet Types

All bullets identified by flag properties on the bullet object. Player bullets live in `game.bullets[]` / `game.trackingBullets[]`. Enemy bullets live in `game.enemyBullets[]`.

---

### Player Bullets

| Bullet | Flag | Size | Speed | Damage | Life | Visual |
|---|---|---|---|---|---|---|
| Normal | *(player array)* | 4×10 | 8 up | 25 | Until off-screen | Cyan rect; orange during Rapid Fire |
| Tracking | *(tracking array)* | 6×6 | 6 + homing | 20 | 180 frames | Purple circle, white core, soft glow |
| Tracking Overflow | `isTrackingOverflow` | 8×8 | 6 + homing | 75 | 300 frames | Pulsing magenta circle, bright white core; explodes at 30% screen height |

---

### Enemy / Boss Bullets

| Bullet | Flag | Size | Speed | Damage | Life | Special Behaviour | Colour / Shape |
|---|---|---|---|---|---|---|---|
| Standard | *(none)* | 5–8 | 3–5 | 28–60 | Until off-screen | — | Red rectangle `#ff4444` |
| Drone Bullet | `isDroneBullet` | 8×8 | 4 aimed | 65 | Until off-screen | Aimed directly at player | Bright green circle, white core |
| Void Bullet | `isVoidBullet` | 8–12 | 2–6.5 | 32–85 | Until off-screen | — | Purple triple-layer circles (`#8e44ad` → `#c39bd3` → `#e8daef`) |
| Fast Void | `isVoidBullet` + `isFastVoid` | 6–9 | 5.5–7 | 32–85 | Until off-screen | Yellow warning glow if about to teleport | Hot pink/magenta circles with motion trail (`#b83dba` → `#e91e63` → `#ff69b4`) |
| Teleport Void | `isVoidBullet` + `isTeleportBullet` | 8–12 | 2–4.5 | 45 (capped) | Until off-screen | After `teleportTimer` frames (20–60), vanishes and reappears near player at new speed. 30-frame hit cooldown per player. | Same purple void visual; hides during teleport |
| Final Attack | `isVoidBullet` + `isTeleportBullet` + `isFinalAttackBullet` | 8–12 | 0.5–1.5 drift | 55 | Until off-screen | Same as teleport void but shorter timers (15–45 frames), fired from screen edges | Same as teleport void |
| Regular+ | `isRegularPlus` | 8–10 | 4–5 | 40–85 | Until off-screen | **On hit: inflicts health drain** — 2 damage every ~0.33 s for 3 s (bypasses shield). Emits 3 flame particles per frame. | Layered orange-red rects (`#ff4444` → `#ff8800` → `#ffaa00`) with orange glow |
| Bomb Bullet | `isBombBullet` | 4–8 | varies | 30–85 | Until off-screen | From Mark II bomb explosion. May also have `isRegularPlus` | Red rect (or orange-red if also `isRegularPlus`) |
| Knight Bullet | `isKnightBullet` | 7–12 | 4–5.5 | 44–62 | Until off-screen | — | Red rectangle (uses default draw fallback) |
| Mark III Bullet | `isMarkIIIBullet` | 6–9 | 3–5 | 40–60 | Until off-screen | — | Pink-red layered rects (`#ff3366` → `#ff6699` → white core) |
| Missile | `isMarkIIIBullet` + `isMissile` | 12×12 | 4 aimed | 60 | Until off-screen | Aimed at player's approximate position | Grey body, red nose, yellow tail |
| Cluster Bullet | `isClusterBullet` | 6×6 | random all-dir | 35 | Until off-screen | From cluster bomb explosion | Orange circle (`#ff6600` → `#ffaa00`) |
| Self-Destruct | `isSelfDestructBullet` | 5–8 | varies | 40–50 | Until off-screen | From Mark III self-destruct sequence | Red circle (`#ff0000` → `#ff6666` → white core) |

---

### Laser-Type Bullets

| Bullet | Flag | Size | Speed | Damage | Life | Visual |
|---|---|---|---|---|---|---|
| Laser Segment | `isLaser` | 20×20 | 15 | 95 | 60 frames (fades) | Red circle with white core; chained into a beam |
| Advanced Laser | `isAdvancedLaser` | 25×25 | 18 | 120 | 75 frames (fades) | Orange-red halo → orange core → yellow-white centre; 3 parallel beams of 12 each |
| Laser Pulse | `isLaserPulse` | 40×40 | 9 | 150 | 90 frames | Expanding orange ring (grows over life) + purple interior orb + white core; fired at beam tips |
| Laser Warning | `isLaserWarning` | 2×2 | 0 (stationary) | **0** | 20 frames | Flashing yellow dashed line spanning the full screen through origin point; 0 damage — guidance only |
| Laser Beam | `isLaserBeam` | 8×8 | 30 | 60 | 25 frames | Full screen-spanning line: orange outer glow (w20) → orange core (w12) → white inner line (w4); follows the warning line |
| Laser Bullet | `isLaserBullet` | varies | varies | varies | 60 frames (fades) | Orange rectangle (`#ff8800`) with white inner rect; used by Machine of the Void turret |

---

### Quick Damage Reference

| Source | Bullet | Damage |
|---|---|---|
| Player normal | — | 25 |
| Player tracking | — | 20 |
| Player tracking overflow | — | 75 |
| Drone | `isDroneBullet` | 65 |
| Void Soldier | `isVoidBullet` | 70–75 |
| Void Sniper | `isVoidBullet` | 80 |
| Void Warrior | `isVoidBullet` + `isTeleportBullet` | 45 (capped) |
| The Knight bullets | `isKnightBullet` | 44–62 |
| Knight laser | `isLaser` | 95 |
| Knight advanced laser | `isAdvancedLaser` | 120 |
| Knight laser pulse | `isLaserPulse` | 150 |
| Mark II regular+ | `isRegularPlus` | 52–85 |
| Mark III bullet | `isMarkIIIBullet` | 40–60 |
| Mark III missile | `isMarkIIIBullet` + `isMissile` | 60 |
| Mark III cluster | `isClusterBullet` | 35 |
| Mark III laser beam | `isLaserBeam` | 60 |
| Mark III self-destruct | `isSelfDestructBullet` | 40–50 |
| The Count void | `isVoidBullet` | 32–45 |
| The Count final attack | `isFinalAttackBullet` | 55 |
| Machine void bullet | `isVoidBullet` | 85 |
| Machine regular+ | `isRegularPlus` | 65 |
| Machine standard | *(none)* | 50 |
