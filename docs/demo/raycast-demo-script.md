     1|# Raycast demo script
     2|
     3|Presenter-facing guide for portfolio reviews, interviews, and internal playtests. **Target length:** **3–5 minutes** (tables below default to ~4 min). For a **minimal ordered checklist** (menú → … → World 2 teaser), use **[demo-script.md](./demo-script.md)**. Primary mode is **`RaycastScene`** (Episode 1 + boss + optional later worlds). **`ArenaScene`** is a short secondary proof for regression coverage.
     4|
     5|**Companion assets:** capture intent per frame in [`../assets/screenshots/SHOT_LIST.md`](../assets/screenshots/SHOT_LIST.md).
     6|
     7|### Narrative arc (what reviewers should remember)
     8|
     9|1. **Legit build** — browser raycast slice, TypeScript + tests + CI.
    10|2. **Feel** — terminal horror tone, director-driven pressure, readable HUD.
    11|3. **Finish line** — sector report / rank proves presentation + systems wiring (optional: World 2 peek = second “hell,” not a recolor).
    12|
    13|---
    14|
    15|## One-line pitch
    16|
    17|> “Original clean-room raycast horror slice in the browser — Phaser 3 + TypeScript, director-driven pacing, shipped Episode 1 plus boss and optional World 2 data.”
    18|
    19|**Clean-room line (use verbatim when asked about inspiration):**
    20|
    21|> “This is an original project. It aims for a classic retro horror raycast FPS feel, but it does not reuse Doom or Doom 64 code, assets, names, maps, sprites, sounds, or copyrighted content. Inspiration is limited to high-level targets like movement clarity, pressure pacing, and readable atmosphere.”
    22|
    23|---
    24|
    25|## Environment
    26|
    27|```bash
    28|npm ci
    29|npm run dev
    30|```
    31|
    32|Use a stable window size (e.g. **960×540** or **1280×720**) for consistency with portfolio screenshots. Optionally keep devtools open once for a console sanity check; close it for the actual demo.
    33|
    34|---
    35|
    36|## ~4-minute demo (recommended; fits 3–5 min window)
    37|
    38|| Time | Action | Talking points |
    39||------|--------|----------------|
    40|| 0:00–0:45 | **Menu** | Primary mode is **A / 3D**; **B** is sandbox; **D** is difficulty. |
    41|| 0:45–2:00 | **Prologue → sector 1** | Terminal tone; WASD, look, fire; read objective / HUD. |
    42|| 2:00–3:15 | **Progression** | Token → door → trigger or ambush; compact HUD; audio + director pressure. |
    43|| 3:15–4:00 | **Level clear** | Sector report: score, rank, time; **ESC** returns to menu. |
    44|
    45|**Shorter (~3 min):** compress progression to one door + one fight, skip extra routing; still hit **clear overlay** or **boss-down** menu.
    46|
    47|**Longer (~5 min):** add one extra sector beat or a **World 2** peek after boss (**N**) — banner shows **ABYSS STRATUM** / **NOT THE FORGE** — then **ESC** to menu.
    48|
    49|Skip **Arena** unless the audience cares about the 2D sandbox — if so, add **~30 s**: **B**, one duel, **ESC**.
    50|
    51|---
    52|
    53|## Controls (presenter cheat sheet)
    54|
    55|### Raycast
    56|
    57|- Move **WASD** · Look: mouse, **Q/E**, arrows
    58|- Fire: click, **F**, Space · Weapons **1–3**
    59|- **R** restart sector · **N** next (when overlay allows) · **ESC** menu · **TAB** debug (keep off)
    60|
    61|### Arena
    62|
    63|- **R** restart · P1 **WASD** + **F** · P2 arrows + **L**
    64|
    65|---
    66|
    67|## What to verify while presenting
    68|
    69|- Menu copy positions raycast as the main experience.
    70|- HUD and combat messages stay readable under motion.
    71|- Pickups, doors, triggers, and exits behave as expected.
    72|- Clear overlay explains **continue / replay / menu** without ambiguity.
    73|- No persistent console errors during a normal run.
    74|
    75|---
    76|
    77|## 10-minute playtest / QA pass
    78|
    79|| Segment | Focus |
    80||---------|--------|
    81|| 0–2 min | Menu → prologue → raycast; pointer lock, weapons, console once |
    82|| 2–5 min | Sector 1: keys, doors, at least one ambush or trigger |
    83|| 5–8 min | Advance; pacing, HUD, intentional damage tick for feedback |
    84|| 8–10 min | Clear or finale overlay; **ESC** menu; optional **B** arena smoke |
    85|
    86|---
    87|
    88|## Optional: asset refresh
    89|
    90|To regenerate menu → combat stills and GIFs (Playwright + sharp + ffmpeg):
    91|
    92|```bash
    93|npx playwright install chromium   # once per machine
    94|npm run capture:media
    95|```
    96|
    97|Level-clear still is **manual** — see `SHOT_LIST.md`.
    98|
    99|---
   100|
   101|## Longer sessions
   102|
   103|For a **10+ minute** deep dive, extend the 4-minute flow with: second sector routing, minimap habit (**H** help if needed), optional World 2 entry after boss when demonstrating the rift arc, and a deliberate death once to show failure overlay copy.
   104|
   105|---
   106|
   107|## Suggested Q&A angles
   108|
   109|- **Why Phaser?** Fast iteration, solid browser audio/input, scene graph fits episode flow.
   110|- **Testing:** Vitest on pure logic (combat, director, summaries) reduces regressions without canvas harness.
   111|- **Scope:** Vertical slice — emphasis on finish line and clarity over content volume.
   112|- **Arena:** Retained as compatibility sandbox; raycast is the product story.
   113|