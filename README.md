<p align="center">
  <img src="docs/assets/doombanner.png" width="100%" alt="Project banner"/>
</p>

# doom-bin-bash-edition

**Original retro-horror raycast FPS** — browser-playable vertical slice built with **Phaser 3**, **TypeScript**, and **Vite**. The shipped experience is **`RaycastScene`**: a clean-room first-person mini-campaign (Episode 1, boss, optional World 2 arc), compact combat, **`GameDirector`** pacing, HUD/minimap, score/run summary, and generated WebAudio. **`ArenaScene`** remains a **secondary** 2D sandbox for regression coverage.

**Status:** Demo-ready / portfolio-ready slice — logic tested (`vitest`), linted, production build verified; CI via GitHub Actions.

---

## Disclaimer

Portfolio / learning project. Inspired by the **feel** of classic retro FPS titles; **not** affiliated with Doom or Doom 64. No reuse of their code, assets, maps, names, sprites, sounds, or copyrighted content.

## Clean-room boundary

No copied gameplay assets, maps, proprietary data, or reverse-engineered implementations. No content from DOOM64-RE. References are **high-level only** (movement clarity, strafe play, pacing, readable horror atmosphere). Layouts, tuning, names, and visuals in this repo are original.

---

## Features (current slice)

- **Raycast episode:** menu → terminal prologue → **Episode 1** (five sectors + **Volt Archon** boss) → optional **World 2** two-sector rift (data-driven).
- **Gameplay:** WASD movement, mouse / keys turning, hitscan weapons, doors/keys/secrets, ambush triggers, objectives, pause/death/clear flows.
- **Presentation:** compact HUD, minimap, difficulty presets, run summary with score/high score/rank, atmospheric palette (Episode 1 vs World 2 segment).
- **Systems:** `GameDirector` (calm → warning → pressure → ambush → recovery), enemy roles (`GRUNT`, `STALKER`, `RANGED`, `BRUTE`), anti-camp pressure.
- **Quality:** extensive **unit tests** for raycast/combat/director/presentation paths that do not require Phaser canvas.
- **Arena (secondary):** local 2-player arena sandbox — preserved, not the primary product.

---

## Quick start

```bash
npm ci
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`). From the menu: **click “Press A: 3D Mode”** or press **`A`** to start the raycast path (prologue → episode). **`B`** opens the 2D arena. **`D`** cycles raycast difficulty.

---

## Controls

| Context | Keys |
|---------|------|
| **Menu** | **A** — raycast episode · **B** — 2D arena · **D** — cycle difficulty |
| **Raycast** | Move **WASD** · Turn mouse / **Q** **E** / arrows · Fire **F** / Space / click · Weapons **1–3** · Restart **R** · Next level **N** (when clear overlay) · **ESC** menu · **TAB**/backtick debug |
| **Arena** | P1 **WASD** + **F** · P2 arrows + **L** · **R** restart arena |

---

## Verification

```bash
npm run test
npm run lint
npm run build
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Full documentation index |
| [docs/architecture.md](docs/architecture.md) | Raycast-first architecture (current) |
| [docs/roadmap.md](docs/roadmap.md) | Historical roadmap + product pointers |
| [docs/demo/raycast-demo-script.md](docs/demo/raycast-demo-script.md) | Demo / playtest script |
| [docs/demo/release-checklist.md](docs/demo/release-checklist.md) | Pre-release smoke checklist |
| [docs/phase25-release-readiness.md](docs/phase25-release-readiness.md) | Portfolio / release readiness (Phase 25) |

---

## Screenshots & media

**Moodboard images** in `docs/assets/` are **visual inspiration only**, not gameplay.

**Gameplay screenshots:** add optimized captures under [`docs/assets/screenshots/`](docs/assets/screenshots/README.md) and embed them in this README when ready (see folder README for naming).

---

## Demo (3–5 minutes)

1. Menu — show **A** / click 3D mode and optional **D** difficulty.  
2. Prologue → first sector — movement, fire, objective line.  
3. Token, door, one combat beat — HUD + director feel.  
4. Level clear overlay — time, score, **ESC** back.  

Full presenter script: [docs/demo/raycast-demo-script.md](docs/demo/raycast-demo-script.md).

---

## Repository layout (abbrev.)

```text
src/game/scenes/       MenuScene, PrologueScene, RaycastScene, RaycastWorldLockedScene, ArenaScene
src/game/raycast/      Renderer, map, levels, combat, enemy, HUD, episode, presentation, …
src/game/systems/      GameDirector, combat, audio, input, …
src/tests/             Vitest — raycast, combat, director, presentation, …
docs/                  Architecture, demo scripts, phase notes, assets
```

Details: [docs/architecture.md](docs/architecture.md).

---

## Stack

Phaser 3 · TypeScript · Vite · Vitest · ESLint · Prettier · GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

---

## Technical highlights

- **Raycast column renderer** + original maps and level data (no external map packs).
- **Scene graph** separates presentation (`RaycastPresentation`, `RaycastRunSummary`) from simulation.
- **`GameDirector`** and pacing helpers are unit-tested where logic is pure.
- **World 2** data lives in `RaycastWorldTwoLevels.ts` (re-exported from level module).
- **No live service** — high score is **local** (`localStorage`).

---

## Visual inspiration (moodboard)

**Not in-game screenshots.** Style reference only.

<p align="center">
  <img src="docs/assets/im1.png" width="90%" alt="Visual inspiration moodboard 1"/>
</p>
<p align="center">
  <img src="docs/assets/im2.png" width="90%" alt="Visual inspiration moodboard 2"/>
</p>
<p align="center">
  <img src="docs/assets/im3.png" width="90%" alt="Visual inspiration moodboard 3"/>
</p>

---

## Project status & roadmap

The repo is a **complete-playable vertical slice**: raycast campaign loop, boss, optional World 2 continuation when enabled in data, score persistence, tests and CI.

- **Historical** 4-week team roadmap (arena MVP era): [docs/roadmap.md](docs/roadmap.md)  
- **Engineering / polish phases** (runtime, World 2 identity, encounters, scoring, release): see [docs/README.md](docs/README.md#phase-notes-engineering--planning)

Maintenance-style next steps (optional): add real gameplay screenshots, short recorded GIF for README, micro-tuning from playtest notes — **not** large new mechanics.

---

## License

No `LICENSE` file is shipped in this snapshot; treat as **all rights reserved** / private portfolio unless the maintainer adds an explicit license.
