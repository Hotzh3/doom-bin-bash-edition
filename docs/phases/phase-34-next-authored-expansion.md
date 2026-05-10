# Phase 34 — Next Authored Expansion (Ember Meridian)

Shipped **World 3 — Ember Meridian**: a third authored hell arc after World 2, with its own palette/atmosphere, one **new enemy kind** (`SCRAMBLER`) and tactical role (**HARASS**), authored encounters that teach harassment reads, **secrets tied to score/medal pressure**, and a terminal boss preset (**Ash Judge**, `ash-judge`).

## Goals

| Goal | Outcome |
|------|---------|
| Distinct biome / world | `worldSegment: 'world3'`, HUD/CSS (`RaycastPalette`), fog layer (`RaycastAtmosphere`), zone themes `ash-conduit` / `ember-vault` (`RaycastVisualTheme`). |
| Enemy pack with clear role | `SCRAMBLER` — fast harassment; director synergy in `enemyPressureSynergy.ts`. |
| Encounter pack | Three catalog levels in `RaycastWorldThreeLevels.ts` — ramp, gate cut, Ash Judge seal. |
| Boss / setpiece | Ash Judge volley identity in `RaycastBoss.ts`; presentation hooks on authored triggers (`ALARM_SURGE`, `RITUAL_PULSE`). |
| Secrets with impact | Ledger / shard / sump niches — score spine + full-arc medal messaging (see level `secrets`). |

## Out of scope (explicit)

- Heavy procedural generation (maps remain reused grids from `RaycastMap`).
- Renderer rewrite; multiplayer; complex inventory / skill trees; live service.

## Subphases

| ID | Focus |
|----|--------|
| **34A** | Biome bible + atmosphere/palette/theme IDs — see [`design/biome-bible.md`](../design/biome-bible.md). |
| **34B** | `SCRAMBLER` config, HUD/minimap, director ensemble picks, level triggers/spawns. |
| **34C** | `ash-judge` boss behavior + arena level; episode chain from last W2 → W3 catalog. |
| **34D** | Score constants (`RAYCAST_WORLD3_ENTRY_POINTS`), presentation copy, tests, polish pass. |

## Implementation map

| Area | Files / symbols |
|------|-------------------|
| Catalog | `RAYCAST_WORLD_THREE_CATALOG`, `RaycastWorldThreeLevels.ts` |
| Episode | `RaycastEpisode.ts` — W2 last sector → `meridian-ember-ramp`; W3 internal chain |
| Level registry | `RaycastLevel.ts` — `worldSegment` includes `world3` |
| Boss | `RaycastBoss.ts` — `RaycastBossBehaviorId` includes `ash-judge` |
| Atmosphere / HUD | `RaycastAtmosphere.ts`, `RaycastPresentation.ts`, `RaycastScene.ts` |
| Score | `RaycastScore.ts` — scrambler kill points, World 3 entry bonus |

## Tests

Vitest coverage includes World 3 catalog resolution, episode progression, atmosphere segment layer, presentation banner, Ash Judge HUD lines, enemy config kinds/roles, and score constants.

## Differentiation (handoff)

- **World 3** reads **warm ash / ember** vs World 2 **cold ion stratum** — same retro-DOOM 64 horror lane, different color psychology and copy (“third hell”).
- **SCRAMBLER** fills a **harassment** niche — not a duplicate flank or ranged lane denial.
- **Ash Judge** asks for **volley geometry reads** (rotating spires → denser fan) distinct from Volt Archon / Bloom Warden.

## Ready for future growth

- Additional W3 sectors by appending to `RAYCAST_WORLD_THREE_CATALOG` and reusing geometry templates.
- More `SCRAMBLER` beats without new AI states — spawn scripts + triggers only.
- Optional second boss preset later — same `RaycastBoss` disk + telegraph pattern.
