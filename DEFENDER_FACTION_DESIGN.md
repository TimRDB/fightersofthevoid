# Defender Faction Design Document

## Overview
The **Defenders** are a rogue faction of void-defending human pirates appearing in **Level 5**. They use human-style ship designs similar to the player but with military/pirate aesthetics featuring wings, fighter jet appearances, heavy bombers, gun emplacements, and exhausts.

**Color Scheme:** Red, Orange, Yellow, and Silver

---

## Enemy Roster (6 Variants)

### 1. **Defender Normal**
**Visual:** Small fighter with short wings, single exhaust, silver body with red accents
**Stats:**
- Width: 28, Height: 28
- Health: 45
- Speed: 2.2
- Color: '#cc3333' (red primary)
- Shoot Rate: 1400ms
- Pattern: 'defender_normal_shot' (aimed single shot)
- Points: 18

**Movement:** Slight sinusoidal drift (gentle wave pattern)
**Attack:** Single aimed bullet at player

---

### 2. **Defender Fast** (Interceptor)
**Visual:** Sleek fighter jet with swept-back wings, dual exhausts, silver/yellow stripes
**Stats:**
- Width: 22, Height: 26
- Health: 30
- Speed: 4.5
- Color: '#ffaa00' (orange/yellow)
- Shoot Rate: 900ms
- Pattern: 'defender_fast_burst' (quick 2-shot burst)
- Points: 22

**Movement:** Aggressive zigzag with rightward drift bias
**Attack:** Rapid 2-shot burst aimed at player

---

### 3. **Defender Heavy** (Bomber)
**Visual:** Wide bomber with large wings, quad exhausts, heavy armor plating, silver/red
**Stats:**
- Width: 48, Height: 42
- Health: 120
- Speed: 1.2
- Color: '#aa2222' (dark red)
- Shoot Rate: 2200ms
- Pattern: 'defender_heavy_cluster' (cluster bomb capability)
- Points: 40

**Movement:** Slow arched descent (left-to-right arc)
**Attack:** **Cluster Bomb Pattern 1** - "V-Formation Spread"
- 3 cluster bombs in V-shape
- Each explodes into 6 bullets (reduced from Mark III's 8)
- 1 explosion wave (vs Mark III's 3)

---

### 4. **Defender Zigzag** (Assault Fighter)
**Visual:** Angular fighter with forward-swept wings, triple exhausts, orange/silver camo
**Stats:**
- Width: 32, Height: 32
- Health: 55
- Speed: 2.8
- Color: '#ff6622' (bright orange)
- Shoot Rate: 1100ms
- Pattern: 'defender_zigzag_spread' (3-way spread)
- Points: 28

**Movement:** Aggressive zigzag with leftward drift, evasive maneuvers
**Attack:** 3-way spread shot with slight randomization

---

### 5. **Defender Sniper** (Long-Range)
**Visual:** Elongated fuselage, narrow wings, precision gun mount, yellow/silver
**Stats:**
- Width: 26, Height: 40
- Health: 50
- Speed: 1.8
- Color: '#ffcc33' (yellow)
- Shoot Rate: 2800ms
- Pattern: 'defender_sniper_precision' (high-damage aimed shot)
- Points: 38

**Movement:** Slow horizontal drift (alternates left/right), maintains distance
**Attack:** High-damage precision shot (60 damage vs normal 45)

---

### 6. **Defender Elite** (Heavy Assault Cruiser)
**Visual:** Large cruiser with extended wings, multiple gun emplacements, six exhausts, red/silver/gold trim
**Stats:**
- Width: 58, Height: 50
- Health: 280
- Speed: 1.6
- Color: '#dd1111' (crimson)
- Shoot Rate: 1600ms
- Pattern: 'defender_elite_assault' (cluster bomb + burst combo)
- Points: 75

**Movement:** Controlled arched movement with tactical repositioning
**Attack:** 
- **Primary:** 5-shot aimed burst
- **Secondary:** **Cluster Bomb Pattern 2** - "Cross Formation"
  - 4 cluster bombs in cross pattern
  - Each explodes into 7 bullets
  - 2 explosion waves (vs Mark III's 3)

---

## Cluster Bomb Patterns (Distinct from Mark III)

### Pattern 1: "V-Formation Spread" (Defender Heavy)
```
Bombs: 3 in V-shape
Bullets per explosion: 6 (vs Mark III's 8-12)
Explosion waves: 1 (vs Mark III's 3)
Delay between waves: N/A
Total bullets: 18
```

### Pattern 2: "Cross Formation" (Defender Elite)
```
Bombs: 4 in cross pattern (+)
Bullets per explosion: 7
Explosion waves: 2 (vs Mark III's 3)
Delay between waves: 250ms
Total bullets: 56
```

### Pattern 3: "Pincer Strike" (Future Defender Dreadnought)
```
Bombs: 5 in pincer formation (< >)
Bullets per explosion: 5
Explosion waves: 2
Delay between waves: 300ms
Total bullets: 50
```

---

## Implementation Notes

### Movement Patterns
- **Sinusoidal drift:** `enemy.x += Math.sin(Date.now() * 0.001 + enemy.id) * 0.8`
- **Arched descent:** Parabolic path from spawn to bottom
- **Zigzag with drift:** Zigzag + constant horizontal velocity
- **Evasive tactics:** Random direction changes when player bullets nearby

### Visual Design
- All Defenders have **human-style ship bodies** (rectangular/triangular hulls)
- **Wings** extend from sides (various shapes: swept, forward-swept, delta)
- **Exhausts** glow orange/yellow at rear
- **Gun emplacements** visible as small turrets
- **Color gradients** from red→orange→yellow with silver highlights

### Spawn Logic
- Defenders appear in **Level 5** only
- Mix with Warship's Fighter Jet spawns
- Higher spawn rate in later phases
- Elite Defenders are rare (similar to Elite Battleship rarity)

---

## Balance Considerations
- Cluster bombs have **fewer bullets** than Mark III (6-7 vs 8-12)
- Cluster bombs have **fewer waves** (1-2 vs 3)
- Movement patterns make them **predictable but challenging**
- Health values balanced for Level 5 difficulty
- Elite Defender is strong but not mini-boss tier

---

**Status:** Design Complete - Ready for Implementation
