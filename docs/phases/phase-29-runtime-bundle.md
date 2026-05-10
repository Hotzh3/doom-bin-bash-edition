# Phase 29 — Runtime & bundle optimization

Evidence-led changes only; **no renderer rewrite**.

## Baseline (before Phase 29)

Measured with `npm run build` (Vite 5.4, production):

| Chunk | Raw bytes | gzip (reported) |
|-------|-----------|------------------|
| App (`index-*.js`) | ~254 KB | ~66.9 KB |
| `phaser-vendor` | ~1.44 MB | ~337.7 KB |
| **Total JS** | ~1.65 MB | ~405 KB (approx.) |

### Hypotheses

1. **Phaser** dominates transfer size — expected; splitting app code does not shrink total bytes meaningfully.
2. **`RaycastRenderer.render`** — per-column wall pass is intrinsic cost; projections previously allocated **new objects** per visible enemy/projectile/billboard each frame.
3. **`computeBillboardSignature`** runs every frame before cache hit — string building + `.sort()` on keys/doors was redundant because **level iteration order is stable**.
4. **`buildRaycastMinimapModel`** — still allocates map cells each minimap tick; larger refactor deferred (would touch minimap API).

### What we deferred

- Rewriting wall loop / reducing `rayCount` (would change perf vs quality tradeoff).
- Dynamic `import()` of `RaycastScene` (adds latency on first 3D entry; product decision).
- Pooling / incremental rebuild for full minimap model (scope).
- Changing `renderEnemies` early `return` semantics (would alter multi-enemy draw order).

---

## After Phase 29

| Chunk | Raw bytes | gzip (reported) |
|-------|-----------|------------------|
| `index-*.js` (boot, scenes bundle minus raycast) | ~105 KB | ~27.6 KB |
| `game-raycast-*.js` | ~150 KB | ~40.5 KB |
| `phaser-vendor` | unchanged | unchanged |
| **Total JS** | ~1.65 MB | similar gzip sum (~405 KB class) |

**Interpretation:** Total bytes stay in the same ballpark; **manual chunk `game-raycast`** improves **cache granularity** (raycast-only edits may avoid rebusting the smaller entry chunk) and enables **parallel downloads**. Initial HTML loads three scripts instead of two — negligible vs Phaser cost.

### Code changes

| Area | Change |
|------|--------|
| `vite.config.ts` | `manualChunks`: `game-raycast` for `/src/game/raycast/`. |
| `RaycastRenderer.ts` | Preallocated projection slots (`fill*Projection` + `ensure*Slot`) — **no per-frame object literals** for enemy/projectile/billboard projections. |
| `RaycastScene.ts` | `lastPlayerPosition` in-place update; cheaper **billboard signature** (drop redundant sorts); minimap marker loop **without `.filter()` allocation**. |

---

## Verification

```bash
npm run test
npm run lint
npm run build
```

Manual smoke: start dev server, enter raycast mode, confirm movement, combat, minimap markers, billboards at doors/keys/exits unchanged.

---

## Follow-ups (if profiling shows need)

1. **Chrome Performance** sample during combat — confirm GC pressure dropped after projection pooling.
2. **`buildRaycastMinimapModel`** — reuse cell grid when `map` reference unchanged (larger change).
3. **Treeshake Phaser** — only viable with custom Phaser build / alternate bundling; high effort.
