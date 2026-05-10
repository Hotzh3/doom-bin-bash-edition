# Raycast demo script

Presenter-facing guide for portfolio reviews, interviews, and internal playtests. Primary mode is **`RaycastScene`** (mini episode + boss + optional World 2). **`ArenaScene`** is a short secondary proof for legacy / regression coverage.

**Companion assets:** capture intent per frame in [`../assets/screenshots/SHOT_LIST.md`](../assets/screenshots/SHOT_LIST.md).

---

## One-line pitch

> “Original clean-room raycast horror slice in the browser — Phaser 3 + TypeScript, director-driven pacing, shipped Episode 1 plus boss and optional World 2 data.”

**Clean-room line (use verbatim when asked about inspiration):**

> “This is an original project. It aims for a classic retro horror raycast FPS feel, but it does not reuse Doom or Doom 64 code, assets, names, maps, sprites, sounds, or copyrighted content. Inspiration is limited to high-level targets like movement clarity, pressure pacing, and readable atmosphere.”

---

## Environment

```bash
npm ci
npm run dev
```

Use a stable window size (e.g. **960×540** or **1280×720**) for consistency with portfolio screenshots. Optionally keep devtools open once for a console sanity check; close it for the actual demo.

---

## 4-minute demo (recommended)

| Time | Action | Talking points |
|------|--------|----------------|
| 0:00–0:45 | **Menu** | Primary mode is **A / 3D**; **B** is sandbox; **D** is difficulty. |
| 0:45–2:00 | **Prologue → sector 1** | Terminal tone; WASD, look, fire; read objective / HUD. |
| 2:00–3:15 | **Progression** | Token → door → trigger or ambush; compact HUD; audio + director pressure. |
| 3:15–4:00 | **Level clear** | Sector report: score, rank, time; **ESC** returns to menu. |

Skip **Arena** unless the audience cares about the 2D sandbox — if so, add **~30 s**: **B**, one duel, **ESC**.

---

## Controls (presenter cheat sheet)

### Raycast

- Move **WASD** · Look: mouse, **Q/E**, arrows
- Fire: click, **F**, Space · Weapons **1–3**
- **R** restart sector · **N** next (when overlay allows) · **ESC** menu · **TAB** debug (keep off)

### Arena

- **R** restart · P1 **WASD** + **F** · P2 arrows + **L**

---

## What to verify while presenting

- Menu copy positions raycast as the main experience.
- HUD and combat messages stay readable under motion.
- Pickups, doors, triggers, and exits behave as expected.
- Clear overlay explains **continue / replay / menu** without ambiguity.
- No persistent console errors during a normal run.

---

## 10-minute playtest / QA pass

| Segment | Focus |
|---------|--------|
| 0–2 min | Menu → prologue → raycast; pointer lock, weapons, console once |
| 2–5 min | Sector 1: keys, doors, at least one ambush or trigger |
| 5–8 min | Advance; pacing, HUD, intentional damage tick for feedback |
| 8–10 min | Clear or finale overlay; **ESC** menu; optional **B** arena smoke |

---

## Optional: asset refresh

To regenerate menu → combat stills and GIFs (Playwright + sharp + ffmpeg):

```bash
npx playwright install chromium   # once per machine
npm run capture:media
```

Level-clear still is **manual** — see `SHOT_LIST.md`.

---

## Longer sessions

For a **10+ minute** deep dive, extend the 4-minute flow with: second sector routing, minimap habit (**H** help if needed), optional World 2 entry after boss when demonstrating the rift arc, and a deliberate death once to show failure overlay copy.

---

## Suggested Q&A angles

- **Why Phaser?** Fast iteration, solid browser audio/input, scene graph fits episode flow.
- **Testing:** Vitest on pure logic (combat, director, summaries) reduces regressions without canvas harness.
- **Scope:** Vertical slice — emphasis on finish line and clarity over content volume.
- **Arena:** Retained as compatibility sandbox; raycast is the product story.
