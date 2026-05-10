# Phase 33 — Technical maturity & optimization

## Goal

Improve **technical elegance** with **evidence-backed** changes only: bundle budgeting, hot-path hygiene, fewer per-frame allocations where justified, clearer scene/chunk boundaries — **no** renderer rewrite, **no** gameplay tuning, **no** micro-optimization without a hypothesis tied to code review or build metrics.

## Evidence summary

### 33A — Baseline (bundle)

Production build (`npm run build`) **before** Phase 33 scene split:

| Artifact | Raw | Gzip |
|----------|-----|------|
| `index-*.js` | ~111 KB | ~28 KB |
| `game-raycast-*.js` | ~153 KB | ~42 KB |
| `phaser-vendor-*.js` | ~1.48 MB | ~338 KB |

**After** Phase 33 (`vite.config.ts` isolates **`RaycastScene`** + **`RaycastWorldLockedScene`** into `game-raycast-scenes`):

| Artifact | Raw | Gzip |
|----------|-----|------|
| `index-*.js` | ~0.9 KB | ~0.5 KB |
| `game-raycast-scenes-*.js` | ~111 KB | ~28 KB |
| `game-raycast-*.js` | ~153 KB | ~42 KB |
| `phaser-vendor-*.js` | *(unchanged)* | *(unchanged)* |

**Interpretation:** Total JS bytes are ~unchanged; **cache invalidation** improves — edits under `src/game/scenes/Raycast*.ts` touch **`game-raycast-scenes`** instead of inflating the bootstrap chunk. Splitting **Menu / Arena / Prologue** into separate chunks was **not** pursued — Rollup reported **circular chunk** graphs when those scenes were isolated (shared imports); avoiding churn beats an artificial chunk count.

### 33B — Bundle splitting

- **`vite.config.ts`** — `manualChunks`: `game-raycast-scenes` + existing `phaser-vendor` + `game-raycast`.

### 33C — Hot paths / allocations

| Area | Change | Risk |
|------|--------|------|
| **`RaycastMinimap`** | Extract **`buildStaticRaycastMinimapCells`**; optional **`staticCells`** on state — scene caches cells per **`level.id` + mapLayoutRevision** | Low — revision bumps when **`openRaycastDoor`** mutates the grid (matches existing unit test for opened doors). |
| **`RaycastScene.renderMinimap`** | Scratch array for labeled markers; linear scan for player marker instead of **`find`** | Low — same visuals. |
| **`RaycastRenderer`** | **No code change** — Phase 29C already uses scratch pools + pre-sized depth buffer; further work needs profiler, not guesswork. |

### 33D — Verification

- `npm run test && npm run lint && npm run build`
- Manual: Episode 1 — minimap **M**, open a door — map topology updates; no duplicate labels.

## Pending risks / follow-ups

- **`buildRaycastMinimapModel`** still allocates **markers** array and **Sets** each minimap tick — acceptable until profiler shows GC pressure; full marker pooling would be a larger refactor.
- **Minimap static cells** cache is session-scoped on the scene — correct invalidation on door open; if future systems mutate the grid without incrementing revision, extend the invalidation hook alongside that code path.
- **Lazy-loading scenes** would shrink first paint but requires Phaser boot changes — out of scope.

## Related docs

- Baseline & history: [`./phase-29-performance-baseline.md`](./phase-29-performance-baseline.md)
- Roadmap: [`../roadmap-next-block.md`](../roadmap-next-block.md)
