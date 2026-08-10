# Sound Usage List — Fighters Of The Void

**Last updated:** 2026-08-05 08:17 NZST

> **How to refresh this file:** ask Claude to "update the sound usage list." It's derived from two places in `Fighters Of The Void v59.html`: the `sfxList` sound-file map (search `const sfxList = {`, currently ~line 1339) and the `buildSoundMetadata()` usage/class labels that power the in-game Sound Tester (search `buildSoundMetadata`, currently ~line 32237). Any sound added to `sfxList` but missing from `buildSoundMetadata` shows as "Unknown / Other" in the Sound Tester — flag those so they get a proper usage label too.

Columns: **Triggered By** (what happens in-game) — `Sound File` — *Category* — *Class*. Class matches the game's own faction system ([[project_classification_system|Enemy & Boss Classification]]: Controlled Human / Void Corrupted / Defender / Void Pure) for enemies, and the Sound Tester's own grouping for everything else.

---

## Player

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Player fires the normal gun | `Player_Shoot_Normal` | Player | Player |
| Player fires the tracking gun | `Player_Shoot_Tracking` | Player | Player |
| Player fires the curved gun | `Player_Shoot_Curved` | Player | Player |
| Player's overflow burst fires | `Player_Overflow_Burst` | Player | Player |
| Player fires the laser weapon | `Player_Laser` | Player | Player |
| Player fires the lance weapon | `Player_Lance` | Player | Player |
| Player's shield absorbs a hit | `Player_Shield_Hit` | Player | Player |
| Player's shield fully depletes | `Player_Shield_Deplete` | Player | Player |
| Player takes damage (no shield) | `Player_Hit_Normal` | Player | Player |
| Player dies | `Player_Death` | Player | Player |

## Powerups

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Health powerup collected | `Powerup_Health` | Powerup | Powerup |
| Shield powerup collected | `Powerup_Shield` | Powerup | Powerup |
| Firepower powerup collected | `Powerup_Firepower` | Powerup | Powerup |
| Rapid Fire powerup collected | `Powerup_RapidFire` | Powerup | Powerup |
| Speed Up powerup collected | `Powerup_SpeedUp` | Powerup | Powerup |
| Speed Down powerup collected | `Powerup_SpeedDown` | Powerup | Powerup |
| Tracking powerup collected | `Powerup_Tracking` | Powerup | Powerup |
| Curved powerup collected | `Powerup_Curved` | Powerup | Powerup |

## Enemies — Controlled Human

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Normal enemy fires its bullet | `Enemy_Normal_Shoot` | Enemy | Controlled Human |
| Heavy enemy fires its bullet | `Enemy_Heavy_Shoot` | Enemy | Controlled Human |
| Sniper enemy fires its bullet | `Enemy_Sniper_Shoot` | Enemy | Controlled Human |
| Drone enemy fires its bullet | `Enemy_Drone_Shoot` | Enemy | Controlled Human |
| Controlled Human enemy takes a non-lethal hit | `Metal_Hit` | Enemy | Controlled Human |
| Controlled Human enemy takes a non-lethal hit (alt variant) | `Metal_Hit_2` | Enemy | Controlled Human |

## Enemies — Void Corrupted

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Void enemy fires its bullet | `Void_Shoot` | Enemy | Void Corrupted |
| Void Sniper fires its bullet | `Void_Sniper_Shoot` | Enemy | Void Corrupted |
| Void enemy takes a non-lethal hit | `Void_Hit` | Enemy | Void Corrupted |
| Void enemy dies | `Void_Death` | Enemy | Void Corrupted |
| Void Master's beam attack charges/fires | `VoidMaster_Beam` | Enemy | Void Corrupted |
| Void Asteroid Layer's crystalline laser fires | `VoidAsteroid_Laser` | Enemy | Void Corrupted |
| Void enemy teleport-blinks away (e.g. Void Phantom); also reused by the Gatekeeper's teleport-burst attack | `Void_Blink` | Enemy | Void Corrupted |

## Enemies — Defender

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Defender enemy fires its bullet | `Defender_Shoot` | Enemy | Defender |
| Defender Heavy fires its bullet | `Defender_Heavy_Shoot` | Enemy | Defender |
| Defender enemy takes a non-lethal hit | `Defender_Hit` | Enemy | Defender |

## Enemies — Void Pure

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Void Protector's shield absorbs a hit | `Protector_Shield_Hit` | Enemy | Void Pure |
| Void Protector's shield recharges | `Protector_Recharge` | Enemy | Void Pure |
| Pure Void enemy fires its bullet | `PureVoid_Shoot` | Enemy | Void Pure |
| Pure Void enemy takes a non-lethal hit | `PureVoid_Hit` | Enemy | Void Pure |
| Pure Void enemy dies | `PureVoid_Death` | Enemy | Void Pure |

## Bosses

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Generic boss pattern-fire beat (used by most bosses' regular attacks — Mark I/II/III, The Knight) | `Boss_Pattern_Shot` | Boss | Boss |
| Generic boss death explosion (every boss except the Gatekeeper, which uses its own death sound) | `Boss_Explosion_Long` | Boss | Boss |
| The Knight's basic laser attack | `Knight_Laser` | Boss | Boss |
| The Knight's advanced/charged laser attack | `Knight_Laser_Advanced` | Boss | Boss |
| The Knight teleports | `Knight_Teleport` | Boss | Boss |
| The Count charges its final attack | `Count_FinalCharge` | Boss | Boss |
| The Count releases its final attack | `Count_FinalRelease` | Boss | Boss |
| Cluster bomb / lobbed bomb is launched — Destroyer Mark III Prototype and The Gatekeeper | `Cluster_Launch` | Boss | Boss |
| A launched cluster bomb detonates — Destroyer Mark III Prototype and The Gatekeeper | `Cluster_Explode` | Boss | Boss |
| Destroyer Mark II deploys its bomb | `Mark2_Bomb_Deploy` | Boss | Boss |
| Destroyer Mark II's bomb explodes | `Mark2_Bomb_Explode` | Boss | Boss |
| The Gatekeeper dies | `Gatekeeper_Death` | Boss | Boss |
| Guided laser-bomb charge whine — Destroyer Mark III Prototype's self-destruct laser and The Gatekeeper's laser attacks | `LaserBomb_Warn` | Boss | Boss |
| Guided laser-bomb beam blast fires — Destroyer Mark III Prototype and The Gatekeeper | `LaserBomb_Fire` | Boss | Boss |
| Machine Of The Void's stuttering industrial laser fires | `Machine_Laser` | Boss | Boss |
| Machine Of The Void's black hole attack | `Machine_BlackHole` | Boss | Boss |

## Effects

| Triggered By | Sound File | Category | Class |
|---|---|---|---|
| Small explosion (e.g. regular enemy death) | `Explosion_Small` | Effects | Effects |
| Small explosion, alt variant (alternates with the above for variety) | `Explosion_Small_2` | Effects | Effects |
| Medium explosion | `Explosion_Medium` | Effects | Effects |
| Big explosion | `Explosion_Big` | Effects | Effects |
| Something catches fire (flame effect starts) | `Flame_Ignite` | Effects | Effects |
| Something continues burning (looping flame effect) | `Flame_Burn` | Effects | Effects |
| Self-destruct countdown alarm | `SelfDestruct_Alarm` | Effects | Effects |
| Asteroid breaks apart | `Asteroid_Break` | Effects | Effects |

---

## Notes for future updates

- Sound file paths themselves live in `sfxList` near the top of the HTML file; this document only tracks *what triggers each sound*, not the file path/format.
- If you rename a sound key in `sfxList`, its entry in `buildSoundMetadata()` needs the same rename or it'll fall back to "Unknown/Other" in the in-game Sound Tester — and this list will need the same rename too.
- When a brand-new sound effect is added for a brand-new enemy/boss/weapon, tell Claude what it's for and ask to add it here (and to `buildSoundMetadata()` if it should show properly in the Sound Tester too).
