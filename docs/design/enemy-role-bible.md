# Enemy role bible (raycast)

Compact reference for **identity**, **synergy**, and **counterplay**. Tactical roles live on `EnemyConfig.tacticalRole`; AI still uses existing `behaviorHint` + `EnemyBehaviorSystem` (no new FSM states).

## Roles & tags

| Kind | Tag | Role | What it asks of the player |
|------|-----|------|----------------------------|
| **GRUNT** | PRS | Pressure | Baseline melee presence—trade space or burn ammo to clear lanes. |
| **BRUTE** | DEN | Denial | Occupies space with slow heavy hits—**reposition**, don’t tank unless healthy; shotgun shines. |
| **STALKER** | FLK | Flank / anti‑idle | Closes fast—**keep moving**, break LoS, prioritize when paired with ranged. |
| **RANGED** | ZONE | Zone denial | Holds lanes at distance—**close during windup** or **sidestep** projectile; deny safe camping. |
| **SCRAMBLER** | HR | Harass | **Doorframe / snap-aim tax**—fast, shallow threat that punishes idle ADS; clear before trading with anchors. |

## Telegraphing

- **Melee**: windup visible via HUD `ARMED` on focused target; stalker windup tuned for a fair react window at knife range.
- **Ranged**: longer windup + slightly slower bolt keeps **windup ≈ readable commitment** without surprise rail-speed shots.

## Synergy (director)

During **PRESSURE** spawns only (after weapon-specific counters):

- **BRUTE without RANGED** → next spawn favors **RANGED** (anchor + lane threat).
- **2× STALKER without BRUTE** → favors **BRUTE** (speed stack gets an anchor).
- **2× SCRAMBLER without BRUTE** → favors **BRUTE** (harass stack gets an anchor).
- **SCRAMBLER + RANGED without STALKER** → favors **STALKER** (layered lane pressure).

This avoids duplicate stacked roles when the arena is already expressing that problem.

## Counterplay cheat sheet

| vs | Do | Avoid |
|----|-----|--------|
| GRUNT | Kite corners, tap‑down | Standing still in doorframes |
| BRUTE | Circle strafe, door choke control | Face‑tanking without heal tempo |
| STALKER | Snap target, cut sightlines | Long trades while ranged tags you |
| RANGED | Close during `ARMED`, serpentine at mid range | Backpedaling in long halls blind |
| SCRAMBLER | Snap-clear at doorframes; peel brute before hard trades | Standing still while scrambling vents |
