# Phase 32 — Portfolio visual polish

## Goal

Make the repository **presentation-ready** for interviews and portfolios: **real** in-game screenshots and GIFs, a **showcase-driven** root README without bloat, a **3–5 minute** demo script, release checklist, and a documented **asset pipeline** — without touching gameplay depth, balance, renderer, or major content.

## Subphases

### 32A — Shot list final

- **[`docs/assets/screenshots/SHOT_LIST.md`](../assets/screenshots/SHOT_LIST.md)** — Canonical five WebPs + two GIFs + optional manual stills (level clear, World 2 teaser).
- Naming and viewport (**960×540**) aligned with [`scripts/capture-portfolio.mjs`](../../scripts/capture-portfolio.mjs).

### 32B — Capture and optimization

- **`npm run capture:media`** — Playwright session → WebP via **sharp**; GIFs via **ffmpeg** (palette, **8 fps**, **400 px** wide — keeps files Git-friendly).
- Script prints **per-file and combined** byte counts after a run (Phase 32).
- Optional: **`CAPTURE_URL=http://127.0.0.1:5173 npm run capture:media`** when Vite is already running.

### 32C — README and demos

- Root **[`README.md`](../../README.md)** — Showcase strip + verified media sizes + pointers to docs.
- **[`docs/demo/raycast-demo-script.md`](../demo/raycast-demo-script.md)** — Primary **~4 min** flow inside **3–5 min** band; optional World 2 peek.
- **[`docs/demo/release-checklist.md`](../demo/release-checklist.md)** — Commands, smoke, portfolio link/size verification.

## Validation

- All README `<img src="...">` paths resolve under `docs/assets/`.
- `npm run test && npm run lint && npm run build`
- After visual or HUD changes: `npm run capture:media` and refresh byte footnotes in README if totals shift.

## Out of scope

- Gameplay / balance / renderer rewrites; heavy binary assets without optimization.

## Related

- Release readiness notes: [`../phase25-release-readiness.md`](../phase25-release-readiness.md)
- Documentation index: [`../README.md`](../README.md)
