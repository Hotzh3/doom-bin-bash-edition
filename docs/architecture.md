     1|# Architecture (current — raycast-first)
     2|
     3|This document describes `src/game/` as oriented today: **`RaycastScene` is the main experience**, `ArenaScene` is a preserved 2D sandbox for regression and local play, and raycast code is grouped by domain under `src/game/raycast/`.
     4|
     5|## Principles
     6|
     7|1. **Raycast as the product:** compact episode, data-driven levels, pure logic where it keeps tests cheap.
     8|2. **Arena as controlled legacy:** do not break 2D flows or tests that still depend on them.
     9|3. **Tests on critical logic:** combat, level graph, director, objectives, episode progression — without requiring a live Phaser canvas for the bulk of assertions.
    10|
    11|## Scenes (`game/scenes/`)
    12|
    13|| Scene | Role |
    14||-------|------|
    15|| `MenuScene` | Entry: start prologue, raycast episode, arena, difficulty. |
    16|| `PrologueScene` | Terminal narrative beat before Episode 1. |
    17|| `RaycastScene` | Main FPS loop: raycast render pass, enemies, HUD, pause, minimap, boss, transitions between sectors/worlds. |
    18|| `RaycastWorldLockedScene` | UX when a world is gated by build/config. |
    19|| `ArenaScene` | 2D sandbox (PvP/PvE); secondary to the portfolio story. |
    20|
    21|There is no separate `BootScene` in the documented flow; Phaser boots and hands off to the menu as configured in the game entry.
    22|
    23|## Raycast (`game/raycast/`)
    24|
    25|Representative modules (not exhaustive):
    26|
    27|| Module | Responsibility |
    28||--------|----------------|
    29|| `RaycastMap.ts` | Grid, geometric ray cast, wall types / tiles. |
    30|| `RaycastLevel.ts` | Level types, **Episode 1** sectors + boss, `RAYCAST_LEVEL_CATALOG`, helpers (`getRaycastLevelById`, reachability, etc.). |
    31|| `RaycastWorldTwoLevels.ts` | **World 2** level data and `RAYCAST_WORLD_TWO_CATALOG` (four sectors). |
    32|| `RaycastWorldThreeLevels.ts` | **World 3** data and `RAYCAST_WORLD_THREE_CATALOG` (three sectors + boss flow as authored). |
    33|| `RaycastRenderer.ts` | Per-column wall rendering, sky/floor bands, atmosphere blending, billboards, enemy silhouettes — **no** third-party texture atlas. |
    34|| `RaycastVisualTheme.ts`, `RaycastPalette.ts`, `RaycastAtmosphere.ts` | Zone themes, fog, corruption tint, world-segment atmosphere, procedural wall/ground accents. |
    35|| `RaycastMinimap.ts` | 2D minimap derived from map + player state. |
    36|| `RaycastHud.ts`, `RaycastPauseMenu.ts`, `RaycastPresentation.ts` | HUD copy, overlays, difficulty strings, banners. |
    37|| `RaycastRunSummary.ts` | End-of-run / sector summary presentation (score, rank, timing). |
    38|| `RaycastEpisode.ts` | Episode progression, next level, world unlock wiring (with scene glue). |
    39|| `RaycastEnemy.ts`, `RaycastEnemySystem.ts`, `RaycastCombatSystem.ts`, `RaycastMovement.ts` | FPS combat and movement. |
    40|| `RaycastBoss.ts` | Boss state and arena behaviour as authored. |
    41|| `RaycastEncounterDirector.ts` | Raycast-side encounter selection / bindings (works with director state). |
    42|
    43|## Shared systems (`game/systems/`)
    44|
    45|| Area | Notes |
    46||------|--------|
    47|| `GameDirector.ts` | Pacing state machine; intensity and spawn pressure for raycast levels that enable it. |
    48|| `EncounterPattern.ts` / `DirectorEvents.ts` | Optional authored spawn patterns consumed by the director. |
    49|| Audio, input, weapon types | Shared with raycast where applicable. |
    50|
    51|## Backend
    52|
    53|None for the shipped slice: **high score and run metadata are local** (`localStorage`). Older docs that mention optional backends are not the current focus.
    54|
    55|## Tests (`src/tests/`)
    56|
    57|- **Raycast:** `raycast-*.test.ts` (map, combat, HUD, episode, atmosphere, presentation, …).
    58|- **Director / encounters:** `game-director.test.ts`, `encounter-pattern.test.ts`, `raycast-encounter-director.test.ts`, etc.
    59|- **Boss / scoring:** `raycast-boss.test.ts`, `raycast-score.test.ts`, …
    60|
    61|Run: `npm test` (see `package.json`). Prefer keeping new gameplay logic testable without full scene boot.
    62|
    63|## Doc history
    64|
    65|- Academic arena roadmap: `docs/roadmap.md` (historical).
    66|- Runtime budget / phases: `docs/phases/phase-21-runtime-budget.md` and later phase files.
    67|- Index: **[docs/README.md](./README.md)**.
    68|