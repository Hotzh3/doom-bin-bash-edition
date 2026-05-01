# FPS Raycast Feel Target

## Intent

The current primary direction for `doom-bin-bash-edition` is an original first-person raycast shooter with the readable pressure, immediacy, and dark arcade mood associated with classic 1990s shooters. This document defines the target feel at a high level; it is not a recipe for copying any specific game.

`RaycastScene` is the main proving ground for this direction. `ArenaScene` remains intact as a secondary mode and sandbox for older systems, local combat experiments, and regression safety.

## Core Feel

- **Constant movement:** the player should almost always want to move. Standing still should feel exposed, while lateral motion and route choices create safety.
- **Immediate input:** movement, turning, weapon switching, and firing should respond without noticeable delay or animation commitment that blocks control.
- **Strafe is central:** combat should reward strafing around threats, slipping past projectiles, and repositioning through tight spaces.
- **Wide FOV:** the camera should favor spatial awareness and fast reads over cinematic narrowness.
- **Horizontal camera:** keep the view level and readable. Avoid pitch-heavy aiming or vertical camera complexity until there is a clear gameplay need.
- **Instant-fire weapons:** the baseline weapon language is hitscan or near-instant impact, with clear muzzle feedback and short recovery windows.
- **Simple enemies, dangerous groups:** individual enemies can be easy to understand, but mixed positioning, numbers, and timing should create risk.
- **Ambush triggers:** doors, pickups, keys, secrets, and thresholds can shift the encounter state from quiet exploration into sudden pressure.
- **Calm to chaos:** levels should breathe. Quiet navigation, ominous rooms, and resource checks should be punctuated by short bursts of combat intensity.
- **Dark but legible atmosphere:** spaces can be claustrophobic and corrupted, but silhouettes, exits, hazards, pickups, and enemy intent must stay readable.

## Interaction Pillars

- `WASD` movement should feel like the primary verb, with strafe on `A/D` and forward pressure on `W`.
- Turning should be fast enough for close threats without making navigation twitchy.
- Combat reads should be simple: see threat, strafe, fire, reposition.
- Enemy behavior should be understandable from motion and spacing before relying on HUD text.
- Level triggers should create surprise through placement and timing, not through unfair hidden damage.

## Atmosphere Pillars

- Use darkness, contrast, fog, palette shifts, and sparse messages to sell tension.
- Favor original generated primitives, original palettes, and authored data made for this project.
- Keep important gameplay elements brighter or higher contrast than background decoration.
- Let audio and visual feedback reinforce state changes: weapon fire, enemy hits, danger spikes, pickups, doors, and ambush activation.

## Feel Target vs Implemented

| Target | Implemented in RaycastScene | Guardrail |
| --- | --- | --- |
| Immediate movement | High acceleration/friction reaches target speed almost instantly, with wall sliding and normalized diagonal movement. | No sprint, stamina, crouch, jump, or heavy head bob. |
| Strafe-centered combat | `A/D` strafe is nearly as fast as forward movement; backward is intentionally slower. | Movement remains simple `WASD` without advanced physics. |
| Wide horizontal camera | Renderer uses a broad classic-FPS FOV and horizontal mouse turn with `Q/E` and arrow fallback. | No vertical aiming system or precision-modern camera stack. |
| Instant, permissive weapons | Click/`F`/`Space` fire immediately; pistol, shotgun, and launcher have distinct cooldown, tolerance, pellets/splash, and feedback. | No reload, ammo complexity, recoil lockout, or copied weapon behavior. |
| Simple dangerous enemies | `GRUNT`, `STALKER`, `BRUTE`, and `RANGED` use readable roles, windups, cooldowns, line-of-sight, and wall collision. | No complex tactical AI, cover behavior, or proprietary enemy names. |
| Calm to chaos pacing | `GameDirector` emits ambient, warning, ambush, pressure, recovery, and stationary-punish events while respecting caps and safe spawns. | No unfair spawning during recovery/exploration unless an explicit event allows it. |
| Classic level structure | The raycast map includes safe start, corridor, first contact, token, locked gate, ambush, arena, secret, exit, and loopback/side route. | Original grid and authored data only; no copied map layouts. |
| Dark but legible atmosphere | Procedural wall bands/glyphs/corruption, distance fog, sector darkness, enemy minimum visibility, compact HUD, and debug toggle. | No external textures, sounds, sprites, or copyrighted assets. |
| Complete run loop | `SIGNAL LOST`, retry, menu return, exit victory, and final run summary are implemented. | ArenaScene remains a secondary sandbox and is not removed. |

## Clean-Room / Original Content Boundary

This project must not copy code, assets, maps, sounds, names, proprietary constants, extracted data, or reverse-engineered implementation from existing commercial games or fan decompilation projects.

Allowed references are limited to high-level design principles: fast movement, immediate input, readable raycast spaces, pressure pacing, simple enemy roles, and dark arcade atmosphere. All implementation, tuning values, level layouts, visual assets, audio, names, and data must be original to this repository or created from permissive sources with clear licensing.
