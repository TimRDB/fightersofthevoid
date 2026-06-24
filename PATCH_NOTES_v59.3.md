# Fighters Of The Void — Patch v59.3
**Date:** June 11, 2026
**Backup of pre-patch file:** `Fighters Of The Void v59_pre_v59.3_backup.html`

---

## 🔴 Critical bug fixes

1. **Restored ~28 invisible particle effects.** Particles pushed with `vx`/`vy` were never
   moved or drawn (`updateParticles` only read `speedX`/`speedY`, positions became `NaN`).
   Now normalized on first update. Restores: enemy thruster trails, Void Soldier/Warrior
   teleport bursts, Regular+ flame trails, asteroid debris, tracking-overflow sparks, and more.
   ⚠️ *Playtest note:* this adds back a whole layer of effects at their designed emit rates —
   if anything feels noisy, thin individual emitters rather than reverting.

2. **Collision loop corruption fixed.** Player/tracking bullets used `forEach` + mid-loop
   `splice`; a bullet that hit an enemy kept processing (could hit boss/asteroids in the same
   frame) and each extra splice deleted the *wrong* bullet. Rewrote both loops as reverse
   `for` with a consumed flag — one bullet, one hit.

3. **Frame-hitch teleport fixed.** `frameScale` was clamped *after* `combinedFrameScale` was
   derived; a tab-switch hitch made bullets/enemies jump massively for one frame. Clamp now
   happens at calculation time.

4. **Frame-rate dependent lasers fixed.** All laser lifetimes (`isLaser`, `isLaserBeam`,
   `isLaserBullet`, `isAdvancedLaser`, `isLaserPulse`) decremented 1/frame — on 144 Hz
   displays they expired 2.4× faster. Now scaled by `frameScale`. Same fix for drone erratic
   movement (`% 30 === 0` never fired with fractional frame scales) and enemy/boss
   `hitFlashTimer`.

5. **Symmetric hitboxes.** `isColliding` only counted obj1's right/bottom half, so hits
   registered late on one side, early on the other. Now a centred AABB.
   ⚠️ *Playtest note:* hitboxes effectively grow slightly on the previously-missing side.

6. **Canvas state-stack leak fixed.** `drawEnemies` opened a `ctx.save()` for fading enemies
   and never restored it — the state stack grew every frame an enemy was fading.

7. **Unpause burst-fire fixed.** All `Date.now()`-based cooldowns (enemy/boss/player fire
   timers, spawn timer, slowdown end) kept running while paused, so everything fired at once
   on resume. Pause transitions are now detected centrally in `gameLoop` and all wall-clock
   timestamps are shifted by the paused duration.

8. **Teleport void bullets now travel during their countdown** (restored movement — design
   decision). They teleport after 40 px of travel OR when their timer expires; previously they
   froze at their spawn point and the distance check was dead code.

9. **Paused-game particle growth fixed.** Regular+ / Regular++ trail particles were spawned
   inside `drawEnemyBullets`, which also runs while paused — the particle array grew without
   bound. Trail spawning moved to `updateBullets` with caps (350 / 450).

## 🧹 Deduplication / code health

- Deleted exact-duplicate `shootFighterJetBullet` definition.
- `renderTerrestrialVariation1–5` existed twice *inside* `gameLoop` (re-instantiated every
  frame); hoisted a single set to top level (~300 duplicated lines removed).
- Extracted `handleEnemyDeath()`, `handleBossDeath()`, `triggerPlayerDeath()` — boss-death
  was triplicated, player-death shrapnel duplicated, and the boss-ram death path was missing
  shrapnel entirely (now consistent).
- Player-vs-powerup and player-vs-enemy loops converted to splice-safe reverse iteration.

## ⚡ Performance

- **Bullet sprite cache** (`_getBulletSprite`): void / fast-void / drone / Regular+ /
  cluster / self-destruct bullets are baked (glow included) to offscreen canvases once per
  type+size — replaces per-bullet-per-frame `shadowBlur` (the most expensive canvas state)
  with one `drawImage`. A subtle dark rim is baked in for readability against nebulae.
- **Nebula sprite cache** (`_getNebulaSprite`): each background nebula was rebuilding 6–9
  radial gradients per frame; now baked once per colour variant (its internal wisp motion
  was ~0.0002 rad/s — imperceptible).
- **DOM writes on change only**: `updateUI` wrote `textContent` / bar widths / gradient
  strings every frame, forcing style recalcs; now cached via `_setText` / `_setStyle`.
- **Particle pool actually pools now**: dead particles are returned to `game.particlePool`
  (it was drained but never refilled); pooled objects have stale type/velocity flags cleared.

## 🎨 Visual & presentation

- **Boss phase-transition telegraph**: white flash + expanding amber ring + small screen
  shake when a boss crosses a phase threshold — escalations read clearly instead of
  silently firing faster.
- **Boss-fight background dim**: starfield/planets dim ~22% (0.5 s fade) while a boss is
  active, spotlighting its patterns when the screen is busiest.
- **Low-health vignette**: soft pulsing red edge below 30% health (alpha capped ~0.15);
  cached sprite, negligible cost.
- **Hit impact ring**: quick expanding ring on damaged enemies alongside the existing white
  flash — sells the hit physically.
- **Player engine trail**: subtle cyan particles while moving (~30/sec, capped).
- **Damage number decluttering**: rapid hits near the same spot merge into one summed
  number; concurrent numbers capped at 12 (oldest dropped).
- **Bullet contrast rims** baked into the cached bullet sprites.

## 📋 Known follow-ups / playtest checklist

- [ ] Hitbox feel (fix #5) — bullets and pickups connect slightly differently.
- [ ] Restored particle effects (fix #1) — check density on Mark II (Regular+ trails) and
      Void Warrior fights.
- [ ] Teleport bullet movement (fix #8) — Void Warrior / The Count difficulty feel.
- [ ] Pause/resume mid-boss-fight — cooldowns should resume naturally.
- [ ] 144 Hz / high-refresh display check if available — lasers and drones now behave the same.
- `drawCraggyCap` / `drawCraggyCap2` remain nested duplicates (closure-bound, cheap); planet
  body sprite-caching is the next perf candidate if more headroom is wanted.

## ❌ Deliberately not changed

- No health regen in empty/sandbox mode (`regenRate` undefined) — kept as-is per design.

---
**Note:** the systems described in `PERFORMANCE_PATCH_v59.2_COMPLETE.md` (object pools,
math cache, batch cleanup, performance monitor) were **not present** in `v59.html` — that
document described work that was never in this file. v59.3 implements the equivalent goals
(pooling, dedup, batch-safe loops) directly.
