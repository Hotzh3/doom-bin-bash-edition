# Next block — suggested priorities

Short horizon after **Phases 26–34**. Pick one thread; avoid parallel incompatible refactors.

**Done — Phase 34:** **Next authored expansion** — World 3 **Ember Meridian** (`RaycastWorldThreeLevels.ts`), enemy kind **`SCRAMBLER`** / role **HARASS**, Ash Judge boss preset **`ash-judge`**, atmosphere/CSS/HUD segment `world3`, score bonus `RAYCAST_WORLD3_ENTRY_POINTS` — see [`phases/phase-34-next-authored-expansion.md`](./phases/phase-34-next-authored-expansion.md), [`design/biome-bible.md`](./design/biome-bible.md), updated [`design/enemy-role-bible.md`](./design/enemy-role-bible.md) + [`design/setpiece-bible.md`](./design/setpiece-bible.md).

**Done — Phase 33:** **Technical maturity & optimization** — `game-raycast-scenes` chunk, minimap static-cell cache + door invalidation, scratch labels — see [`phases/phase-33-technical-maturity-optimization.md`](./phases/phase-33-technical-maturity-optimization.md) and [`phases/phase-29-performance-baseline.md`](./phases/phase-29-performance-baseline.md).

**Done — Phase 32:** **Portfolio visual polish** — README showcase strip, verified capture sizes, demo/release docs, [`SHOT_LIST.md`](./assets/screenshots/SHOT_LIST.md), palette GIF pipeline + post-run size logging in [`scripts/capture-portfolio.mjs`](../scripts/capture-portfolio.mjs) — see [`phases/phase-32-portfolio-visual-polish.md`](./phases/phase-32-portfolio-visual-polish.md).

**Done — Phase 31:** World 2 **final identity** — distinct palette/CSS, atmosphere segment layer, zone grammar, banner + intro copy (**NOT THE FORGE**), director pacing tuning on World 2 levels — see [`phases/phase-31-world-2-final-identity.md`](./phases/phase-31-world-2-final-identity.md) and [`design/world2-identity-bible.md`](./design/world2-identity-bible.md).

**Done — Phase 30:** authored `RaycastSetpieceCue` on triggers/beats, `RaycastScene.stageSetpieceCue` (blackout / alarm / ritual / fake calm / corridor hunt) — see [`phases/phase-30-setpieces-memorable-moments.md`](./phases/phase-30-setpieces-memorable-moments.md) and [`design/setpiece-bible.md`](./design/setpiece-bible.md). World 2 sulfur content bible remains [`biome-phase30-sulfur-stratum.md`](./biome-phase30-sulfur-stratum.md).

**Done — Phase 29:** tactical roles on `EnemyConfig`, HUD/crosshair role tags, raycast silhouette + windup/projectile fairness tuning, director **PRESSURE** ensemble picks via `aliveEnemyKindCounts` — see [`phases/phase-29-enemy-identity-tactical-depth.md`](./phases/phase-29-enemy-identity-tactical-depth.md) and [`design/enemy-role-bible.md`](./design/enemy-role-bible.md).

**Done — Phase 28:** procedural horror beds (`ambientIndustrial`, `ambientCorrupt`), `bossPhaseShift` + telegraph `stingerDread`, recovery silence stretch, damage intensity scaling, Bloom-specific boss HUD lines — see [`phases/phase-28-audio-horror-atmosphere.md`](./phases/phase-28-audio-horror-atmosphere.md).

## A — Feel & onboarding

- Difficulty tooltips or first-sector combat telemetry (existing HUD patterns only).
- Optional **single-sector** score breakdown dev overlay (`TAB` debug) — behind flag.

## B — Content cadence

- Apply **Phase 27 grammar** to remaining Episode sectors (3–5) where pacing still feels uniform — see [`phases/phase-27-encounter-grammar-level-design.md`](./phases/phase-27-encounter-grammar-level-design.md).
- Next authored sector pack using existing `EnemyKind` + director grammar (see Phase 30 bible pattern).
- Boss **behavior preset** only — no new arenas unless explicitly scoped.

## C — Technical hygiene

- Optional **profiler** pass on remaining per-frame allocations (markers / HUD strings) if DevTools shows GC pressure — no change until measured.
- Optional **lazy scene entry** (product tradeoff) — not started.

## D — Portfolio / ship

- Keep README media paths and byte footnotes accurate after UI changes (`npm run capture:media`; script prints sizes).
- CI smoke: keep `npm run test && npm run lint && npm run build` as gate.

---

See **`docs/README.md`** for architecture, demo scripts, and phase notes index.
