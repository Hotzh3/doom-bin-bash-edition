# Phase 31 — World 2 final identity

## Goal

Close **World 2** as a **distinct hell / stratum** — not a warm recolor of Episode 1. Deliver clear **visual**, **spatial grammar**, and **pacing** differentiation using existing raycast surfaces only (no renderer rewrite, no heavy procedural systems, no new enemy kinds, no inventory/meta).

## What shipped

### 31A — Palette & atmosphere

- **`RaycastPalette.ts`** — Colder rift read: `riftFog`, `riftVeil`, `riftIon`, `riftBasalt` tuned for ion/nadir contrast vs Foundry rust; **`RAYCAST_CSS_WORLD2`** HUD panel/text accents aligned with that read.
- **`RaycastAtmosphere.ts`** — **`RAYCAST_WORLD2_SEGMENT_LAYER`** tuning (`fogEndDelta`, `corruptionAlphaScale`, `pulseAlphaScale`, ambient bump/max); intro / idle copy stresses **ABYSS STRATUM** and **NOT THE FORGE** (second hell, not the forge).

### 31B — Landmarks & visual grammar

- **`RaycastVisualTheme.ts`** — Zone branches **`basalt-rift`**, **`ion-shaft`**, **`nadir-glow`** refined so floors/ceilings/accent read as **cold ion + nadir** rather than W1 industrial warmth.
- **`RaycastWorldTwoLevels.ts`** — Encounter strings for **rift-gully** and **bloom-archive** beats sharpen voice (“not Foundry / not infernal rust” line of fiction) without new triggers.

### 31C — Pacing & narrative transition

- **`RaycastWorldTwoLevels.ts`** — Per-level **director** timings (recovery / ambush / high-intensity windows) nudged so World 2 sectors breathe and spike differently from W1 defaults.
- **`RaycastPresentation.ts`** — Episode banner for World 2 includes **`ABYSS STRATUM — NOT THE FORGE`** before sector index and level name.

## Validation

- `npm run test && npm run lint && npm run build`
- Spot-check: World 2 banner, intro line, Fracture → Threshold → Sulfur Lattice flow (no progression ID changes).

## Related docs

- Design bible: [`../design/world2-identity-bible.md`](../design/world2-identity-bible.md)
- Phase 22 direction: [`../phase22-world2-identity.md`](../phase22-world2-identity.md)
- Sulfur content block: [`../biome-phase30-sulfur-stratum.md`](../biome-phase30-sulfur-stratum.md)
