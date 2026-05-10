# Phase 30A — Sulfur Stratum (World 2 extension) — design bible

Authored **content** definition for the next World 2 block. No engine promises here — only how players and tools should *read* the sector, and what the implementation is allowed to assume.

## One-line identity

**Cold ion stratum meets corrosive “bloom”** — the same rift ice as Fracture/Threshold, but with **sulfur-yellow** poison logic in the *fiction* and **toxic / lattice** *read* in the halls. The run is no longer just “find key → two triggers → exit”; it can **chain into a pit relay** where a **mini-boss** tests lane discipline, not DPS.

## Tonality and fantasy

- **Voice:** still telemetry / mission brief (matches existing HUD), but copy leans **biohazard + lattice** (spores, vaults, bloom) instead of pure electrical ion.
- **Emotion:** claustrophobic **conduit climb** under time pressure, then a **breath** before a **read-heavy duel** in the pit.
- **Not:** a new game mode, new enemy species, or new weapons — identity comes from **layout + encounter script + one boss kit**.

## Visual reading rules (authoring)

| Rule | Rationale |
|------|-----------|
| **Basalt / rift** for entry and lower loop | Continuity with Fracture — player reads “same world, deeper route.” |
| **Toxic / bloom** for archive + long conduit | Yellow-green **toxic-green** is the *sulfur bloom* signifier; keep it for *pockets* and the key room, not the whole map. |
| **Ion shaft** for seals and threshold fights | Gates and ambush thresholds stay **cold-tech**, matching World 2 HUD fog and contrast. |
| **Nadir glow** on exit zones | Consistent “cold extraction” finish across World 2. |

### Forbidden / discouraged

- Painting **entire** corridors toxic-green (noise — kills landmark readability).
- Inventing **new zone palette IDs** unless renderer/theme tables gain a row — prefer remixing existing `RaycastZoneThemeId` tokens.

## Encounter vocabulary (roles, not new systems)

Use existing `EnemyKind` only:

| Role | Kind | Counterplay (player-readable) |
|------|------|-------------------------------|
| Lane filler | `GRUNT` | Tap priority when exposed; don’t feed free melee in doorframes. |
| Flank tax | `STALKER` | Check corners; deny sprint-through on loops. |
| Lane denial | `RANGED` | Break line of sight; close during windup. |
| Anchor / peel | `BRUTE` | Kite to wide cells; burn after isolating supports. |

**Director** stays on the **crawl sector** to keep pressure authored but reactive; the **pit** turns director **off** so the Bloom Warden fight isn’t diluted by trash spawns.

## Technical limits (engine reality)

- **Maps:** reuse proven `RaycastMap` grids (Byte-for-byte topology known-good for collision and progression tests).
- **Boss:** reuse **disk hit-test + telegraph volleys** from `RaycastBoss`; differentiate fights via **`behavior`** presets (Archon vs Bloom Warden), not duplicate AI stacks.
- **Progression:** Episode 1 catalog order unchanged; World 2 is a **separate chain** after Episode boss, extended by **additional level IDs** in `RAYCAST_WORLD_TWO_CATALOG`.
- **Scope control:** no new `EnemyKind`, no new weapon curves — tuning is **spawn scripts, director timings, boss preset numbers**.

## Deliverables mapping (30B–30D)

| Subphase | Delivered as |
|----------|----------------|
| **30B** | Sulfur Lattice sector — spawns, triggers, director points, encounter beats. |
| **30C** | Bloom Warden pit — boss arena map + `bloom-warden` volley identity + moderate HP. |
| **30D** | Number passes on cooldowns, spawn budgets, and pickup placement — **no new features**. |

## Success criteria (feel)

- Player can **predict** Bloom Warden danger from **HUD phase strings** and **telegraph color**, not from invisible rules.
- Full World 2 arc **clears** without relying on grind — difficulty is **positioning + reads**, not sponge HP.

---

## Implementation status (shipped in repo)

| Piece | Location |
|-------|----------|
| **30B** — Sulfur Lattice crawl | `RAYCAST_LEVEL_WORLD2_SULFUR_LATTICE` in `RaycastWorldTwoLevels.ts` — authored triggers, director spawns, encounter beats, `toxic-green` / basalt zones. |
| **30C** — Bloom Warden pit | `RAYCAST_LEVEL_WORLD2_WARDEN_PIT` — `RAYCAST_MAP_BOSS`, `bossConfig.behavior: 'bloom-warden'`, director **off**. Volleys + labels in `RaycastBoss.ts`. |
| **30D** — Polish | Director `debugEnabled: false` on World 2 sectors; Bloom Warden pellets use **toxic yellow-green** (`BLOOM_WARDEN_PROJECTILE_COLOR`) vs Archon orange. |
| **Chain** | `RAYCAST_WORLD_TWO_CATALOG`: Fracture → Threshold → **Sulfur Lattice** → **Bloom Warden pit**; `resolveRaycastNextLevelId` appends after Episode 1. |

**Next expand:** another catalog entry or a new `episodeTheme` block using the same enemy vocabulary — no new `EnemyKind` required until design warrants it.
