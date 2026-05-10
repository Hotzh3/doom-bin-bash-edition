# Phase 29 — Performance baseline & plan

Historical **pre–Phase 29** figures (single JS chunk): main JS ~1.72 MB raw / ~402 KB gzip.

## Bundle (production)

### After Phase 29B — vendor split (`npm run build`, Vite-reported gzip)

| Artifact | Raw | Gzip |
|----------|-----|------|
| `dist/assets/index-*.js` (app) | ~241 KB | ~64 KB |
| `dist/assets/phaser-vendor-*.js` | ~1.48 MB | ~338 KB |
| CSS | ~0.34 KB | ~0.23 KB |

**Observation:** Phaser is isolated so **app code changes** no longer invalidate the whole JS blob; first load still downloads both chunks, but caching splits **engine vs game**.

### Historical baseline (pre-split, single chunk)

| Artifact | Raw | Gzip |
|----------|-----|------|
| Main JS (monolith) | ~1.72 MB | ~402 KB |

## Runtime hot paths (code review)

| Area | Cost hypothesis |
|------|-------------------|
| **RaycastRenderer.render** | O(`rayCount`) rays × `castRay` + wall draw — expected dominant CPU; **depth buffer** grown implicitly per column. |
| **RaycastRenderer.renderEnemies** | *(addressed in 29C)* Was **`filter` → `map` → `filter` → `sort`**; now **scratch arrays + in-place sort**; depth buffer **pre-sized**; silhouette path avoids **spread** by mutating size around draw. |
| **renderEnemyProjectiles / renderBillboards** | *(29C)* Same scratch + loop pattern as enemies. |
| **Minimap** | `buildRaycastMinimapModel` still builds **full `cells[]`** each call (unchanged); **`renderMinimap`** *(29C)* reuses scratch arrays for keys/doors/enemy blips; **`RaycastMinimap`** skips **`Array.from`** when `state.enemies` is already an array. |

Gameplay and numerical simulation are **unchanged** by Phase 29; only bundling and allocation patterns.

## Plan (short) — status

1. **29B — Split vendor chunk:** Done — `manualChunks` isolates **`node_modules/phaser`** (`phaser-vendor` chunk).
2. **29C — Hot paths:** Done for renderer enemy/projectile/billboard paths + minimap inputs; **no change** to minimap full-cell rebuild (higher risk / larger diff).

## Smoke check (manual)

After changes: `npm run dev` → Episode 1 raycast 60s — movement, fire, minimap toggle **M**, no visual regressions; optional Performance panel: fewer **minor GC** spikes when many enemies on screen.
