# DOOM64-RE Clean Reference Study

## Objective
This document records a clean, high-level reference study of the public `DOOM64-RE` repository for design learning only. The goal is to understand broad Doom-like organization and gameplay principles so our project can continue evolving toward a fast, dark, pressure-driven shooter with its own identity: **terminal corruption hell arena**.

This phase does not import, copy, or adapt external source code, assets, data, maps, names, sounds, sprites, WADs, ROM data, or exact structures. The reference was used only to confirm that a classic Doom-like is organized around tightly connected loops for player control, map interaction, combat, feedback, and level progression.

## Clean-Room Boundaries
Do not use or copy:

- Source code from `DOOM64-RE` or any reverse-engineered implementation.
- Original game data, ROM data, WAD-derived data, map data, sprite data, sound data, music data, texture data, or binary assets.
- Exact internal names, level names, enemy names, weapon names, or proprietary content from the reference project.
- Exact data formats, map structures, constants, tuning values, or state layouts from the reference project.
- Decompiled or reverse-engineered behavior as implementation instructions.

Allowed use:

- High-level design principles.
- General architecture concepts common to Doom-like games.
- Our own terminology, systems, data, maps, enemies, weapons, tuning, and aesthetics.

## Reference README Observations
The external README emphasizes that the reference project depends on original game data and platform SDK tooling. That makes the boundary clear for our project: we should not use its build chain, extracted data, tool output, assets, ROM/WAD-derived files, or exact content.

The useful takeaway is conceptual rather than technical: a classic Doom-like is a compact set of gameplay systems arranged around a deterministic real-time loop. The player moves through authored spaces, map interactions gate progression, combat pressure is tuned through enemy placement and resource pacing, and feedback must make every door, key, shot, hit, and threat readable.

## Gameplay Principles To Recreate
We want to recreate sensations, not content:

- Fast, readable first-person movement with useful strafing.
- Immediate weapon response and clear weapon roles.
- Enemies that create pressure and movement demands.
- Maze-like progression with locks, keys, doors, triggers, secrets, and exits.
- Pacing that alternates exploration, tension, sudden combat, high intensity, and short recovery.
- Strong feedback for every combat and level interaction.
- Darkness, fog, and oppressive mood without losing combat clarity.
- A compact HUD that communicates state without breaking immersion.

Our own target expression is not gothic military sci-fi. It is **terminal corruption hell arena**: the player is trapped inside a hostile corrupt system that manifests as a digital infernal maze.

## Classic Doom-Like System Map
A Doom-like can be studied as these system responsibilities:

- **Player:** Owns health, position, alive state, interaction state, inventory-like progression flags, and combat agency.
- **Movement:** Provides fast navigation, collision, strafing, wall sliding, and momentum feel.
- **Camera:** Converts player orientation into a first-person view and preserves aiming readability.
- **Weapons:** Define cooldowns, damage, range, spread, projectile or hitscan behavior, and switching.
- **Projectiles:** Carry damage through space, collide with world/enemies/player, and produce impact feedback.
- **Enemies:** Detect, pursue, attack, pressure, retreat where needed, and die with clear feedback.
- **Map:** Encodes navigable space, walls, blocked cells, zones, and progression landmarks.
- **Doors:** Gate space, respond to keys or other conditions, and clearly communicate locked/open states.
- **Keys:** Provide readable progression tokens that convert exploration into access.
- **Triggers:** Bind spaces to events such as ambushes, messages, spawns, state changes, and progression.
- **HUD:** Communicates health, weapon, key/progression state, and critical feedback.
- **Audio/Feedback:** Reinforces actions and threats with low-latency cues.
- **Game Loop:** Orders input, movement, interactions, AI, combat, rendering, feedback, and progression checks.
- **Combat Rhythm:** Uses enemy counts, placement, triggers, cooldowns, health pressure, and recovery windows.
- **Level Progression:** Defines start, route, locks, backtracking, optional secrets, major encounters, and exit.

These are generic architecture principles, not copied implementation details.

## Current Project Comparison
### Player, Movement, And Camera
Existing systems:

- `RaycastScene` owns FPS runtime state: player health, alive state, completion state, keys/secrets, enemies killed, and director inputs.
- `RaycastPlayerController` handles FPS input and camera angle.
- `RaycastMovement` provides arcade acceleration, friction, normalized diagonal movement, and wall sliding.
- `ArenaScene` keeps the 2D mode intact with Phaser arcade physics and two players.

Tuning needed:

- FPS movement should be playtested for corridor readability, turn speed, and enemy avoidance.
- Camera feedback could later support stronger weapon bob/recoil while staying minimal.

### Weapons And Projectiles
Existing systems:

- `WeaponSystem` centralizes weapon switching, cooldowns, damage, projectile spawning, spread, and labels.
- `RaycastCombatSystem` adapts the shared weapon model to FPS frontal hit detection.
- `ArenaScene` uses `PlayerWeaponController` and `Projectile` entities for 2D combat.
- Enemy ranged pressure exists in both 2D and FPS through projectile-like behavior.

Tuning needed:

- FPS weapons need more role distinction in the first-person context.
- Launcher/shotgun behavior currently exists at a system level but could use stronger FPS-specific feedback and risk/reward.

### Enemies
Existing systems:

- `EnemyBehaviorSystem` provides reusable decisions: idle, chase, retreat, melee attack, ranged attack.
- `EnemyAttackSystem` supports 2D enemy attacks and projectile creation.
- `RaycastEnemySystem` adapts enemy movement, line-of-sight, melee, and ranged projectiles to the grid world.
- Enemy kinds already express pressure roles: basic pursuit, tougher bodies, fast pressure, and ranged pressure.

Tuning needed:

- FPS enemies need more positional fairness checks and better spawn telegraphing.
- Enemy silhouette and behavior variety should increase without copying any classic roster.

### Map, Doors, Keys, Triggers, Secrets, Exit
Existing systems:

- `RaycastMap` defines the editable grid and tile types.
- `RaycastLevel` defines zones, keys, locked doors, triggers, secrets, exits, initial spawns, and director spawn metadata.
- `KeySystem`, `DoorSystem`, and `TriggerSystem` are shared between 2D and FPS.
- `ArenaScene` uses the same level interaction concepts in 2D through `arenaLayout` and `LevelSystem`.

Tuning needed:

- The FPS level needs richer spatial design: loops, height illusion, side routes, more meaningful secrets, and better landmarking.
- Doors and pickups need stronger visual distinction and interaction timing.

### HUD, Audio, And Feedback
Existing systems:

- `HUDSystem` handles 2D HUD state.
- `RaycastScene` has a minimal FPS HUD: HP, weapon, key status, director label, system messages, crosshair, damage/muzzle flashes.
- `AudioFeedbackSystem` provides safe procedural cues without asset dependencies.
- `RaycastAtmosphere` centralizes FPS fog, palette, corruption tint, and system messages.

Tuning needed:

- HUD should become less debug-heavy in normal play while keeping a debug toggle.
- Audio needs real authored assets later, with procedural fallback preserved.

### Game Loop And Combat Rhythm
Existing systems:

- `GameDirector` already drives exploration, build-up/tension, ambush, high intensity, and recovery.
- `RaycastScene` feeds the director FPS metrics: health, kills, enemies alive, damage timing, stationary time, equipped weapon, active zone, trigger count, pickup distance, and safe spawn points.
- `ArenaScene` also uses `GameDirector`, proving the logic is shared rather than forked.

Tuning needed:

- Director decisions should become more event-rich without becoming a clone of any reference behavior.
- Recovery and tension should affect ambience, spawn choices, and messages more cleanly.

## Systems That Already Exist
- FPS scene orchestration: `src/game/scenes/RaycastScene.ts`
- FPS raycasting and rendering: `src/game/raycast/RaycastRenderer.ts`, `src/game/raycast/RaycastMap.ts`
- FPS level data: `src/game/raycast/RaycastLevel.ts`
- FPS movement: `src/game/raycast/RaycastMovement.ts`, `src/game/raycast/RaycastPlayerController.ts`
- FPS combat: `src/game/raycast/RaycastCombatSystem.ts`
- FPS enemies: `src/game/raycast/RaycastEnemy.ts`, `src/game/raycast/RaycastEnemySystem.ts`
- Shared director: `src/game/systems/GameDirector.ts`
- Shared weapons: `src/game/systems/WeaponSystem.ts`
- Shared enemy behavior: `src/game/systems/EnemyBehaviorSystem.ts`
- Shared 2D enemy attacks: `src/game/systems/EnemyAttackSystem.ts`
- Shared audio feedback: `src/game/systems/AudioFeedbackSystem.ts`
- Shared keys/doors/triggers: `src/game/systems/KeySystem.ts`, `DoorSystem.ts`, `TriggerSystem.ts`
- 2D mode: `src/game/scenes/ArenaScene.ts`

## Systems Needing Tuning
- Weapon feel in FPS: stronger per-weapon rhythm, recoil/flash/audio, and tactical role separation.
- Enemy spawn fairness: avoid surprise spawns too close, behind the player without warning, or in narrow cells.
- Enemy readability: clearer silhouettes, hit/death states, ranged windup, and projectile warning.
- Map navigation: more landmarks, loops, backtracking clarity, and route composition.
- Door/key feedback: stronger lock/readable access language and better visual tile distinction.
- Director pacing: more nuanced tension events that do not always spawn enemies.
- HUD/debug split: compact player HUD by default, fuller director debug behind a toggle.
- Atmosphere: tune fog and darkness per zone while preserving target visibility.

## Missing Or Incomplete Systems
- Multi-level progression and level transition data.
- Save/checkpoint or restart flow specific to FPS.
- Authoring tools or validation for grid layouts.
- Resource economy beyond health/key state.
- Real audio asset pipeline with procedural fallback.
- Better enemy telegraphing and attack anticipation.
- More robust collision/line-of-sight diagnostics for level authoring.
- Secret scoring or end-of-level summary.
- Configurable difficulty presets.

## Recommendations For Phases 19-25
### Phase 19: FPS Weapon Feel Pass
Improve weapon role clarity with original names and behavior. Add stronger muzzle flashes, cooldown readability, recoil/kick, hit markers, and risk/reward tuning. Keep `WeaponSystem` shared.

### Phase 20: Enemy Readability And Telegraphs
Add original enemy presentation rules: warning flashes, attack windups, death bursts, projectile tells, and better ranged pressure. Do not model any classic enemy directly.

### Phase 21: Level Design Expansion
Create a second original FPS map or expand the current grid into a stronger loop with landmarks, branching paths, secret logic, and more meaningful backtracking.

### Phase 22: Director Event Layer
Extend `GameDirector` to emit pressure events beyond spawns: ambient pulses, fake system warnings, delayed ambush preparation, recovery signals, and route pressure.

### Phase 23: HUD And Debug Modes
Split the FPS HUD into normal and debug views. Normal mode shows health, weapon, key, and critical state. Debug mode shows director internals, zone, spawns, and timings.

### Phase 24: Audio Asset Pipeline
Add a safe audio asset manifest and loader that uses original sounds only. Preserve `AudioFeedbackSystem` procedural fallback when assets are missing.

### Phase 25: Content Validation And Clean IP Checklist
Add validation tests or scripts for map data, spawn points, door/key links, trigger references, and asset naming. Include an IP review checklist for every new content phase.

## Legal And Technical Risks
- Accidentally copying reverse-engineered code or data structures instead of learning principles.
- Reusing names, map concepts, assets, sounds, or enemy identities that belong to an existing game.
- Letting external reference constraints dictate our architecture too closely.
- Overfitting tuning to a classic game and losing our own feel.
- Adding darkness/fog that reduces combat clarity.
- Turning the AI Director into an infinite unfair spawner.
- Mixing 2D and FPS responsibilities in ways that break `ArenaScene`.

Mitigation:

- Keep all implementation authored from our own requirements.
- Use original names, data, maps, enemies, audio, visuals, and messages.
- Document references as high-level concepts only.
- Continue testing `ArenaScene` and `RaycastScene` together.
- Treat `terminal corruption hell arena` as the art and systems filter.

## Clean Implementation Checklist
Before implementing any future Doom-like feature:

- Is the feature described in our own words?
- Does it use original names, data, and tuning?
- Does it avoid copied source, assets, maps, sounds, sprites, and formats?
- Does it strengthen terminal corruption hell arena?
- Does it preserve `ArenaScene`?
- Does it preserve `RaycastScene`?
- Does it have tests for shared logic?
- Does it maintain readable combat?
- Does it avoid infinite or unfair spawns?
- Does it keep debug behavior separate from player-facing UI?

## Keeping Our Identity
Use these identity rules:

- Replace gothic/hell-literal language with corrupt terminal/system language.
- Treat enemies as hostile processes or corrupted entities, not classic monster archetypes.
- Treat keys, doors, triggers, and exits as access control and corrupted system gates.
- Use abstract, high-contrast billboards and procedural shapes before detailed sprites.
- Make audio feel synthetic, damaged, low, and hostile.
- Use palette contrast: black void, terminal cyan, sick green, warning red, hot amber, violet corruption.
- Keep the pacing arcade-fast, but the mood lonely and oppressive.

## AI Director Guidance
The AI Director should not imitate a specific game. It should express our premise: the system is observing the player and adjusting pressure.

Good director behavior:

- Raises pressure when the player stalls.
- Backs off when health is low.
- Uses level triggers as authored dramatic beats.
- Spawns within configured budgets and cooldowns.
- Uses safe spawn points per zone.
- Emits non-spawn events during tension.
- Links atmosphere intensity to combat state.

Avoid:

- Infinite waves.
- Spawn spam in narrow corridors.
- Punishing low-health players with unavoidable damage.
- Exact encounter pacing from any reference.
- Enemy compositions based on external rosters.

## Summary
The clean reference confirms that our project is already moving in the right architectural direction: compact real-time loop, fast movement, weapons, enemies, map interactions, keys, doors, triggers, secrets, exit, feedback, and a shared director.

The next work should focus on tuning, authoring, readability, and identity rather than copying any reference content. Our advantage is that the project already has a clear original frame: **terminal corruption hell arena**.
