# World 2 identity bible (canonical read)

Single reference for how **World 2 — Abyss Stratum** should feel vs **World 1 — Slag Foundry** in shipped code (palette, atmosphere, theme zones, presentation, authored pacing). Content-specific beats (Bloom Warden, sulfur lattice) extend this; see [`../biome-phase30-sulfur-stratum.md`](../biome-phase30-sulfur-stratum.md).

## One-line differentiation

| World | Fantasy | Visual shorthand |
|-------|---------|------------------|
| **W1** | Industrial corruption arena — rust, amber, toxic heat, telemetric hostility | Warm corrosion, terminal orange/green, “forge” language |
| **W2** | Cold ion stratum / signal threshold — second hell, **not** the forge | Basalt + violet veil + **ice-cyan** ion highlights, “rift / nadir / shear” language |

## Systems map (where identity lives)

| Concern | Module | Player-visible effect |
|---------|--------|------------------------|
| Fog & veil color | `RaycastPalette` (`rift*`, CSS world2) | HUD and distance read **blue-violet-cyan**, not amber rust |
| Segment layer | `RaycastAtmosphere` (`RAYCAST_WORLD2_SEGMENT_LAYER`, `RAYCAST_ATMOSPHERE_WORLD2`) | Slightly different fog end, corruption/pulse **scaling**, ambient caps — **legibility preserved** |
| Zone grammar | `RaycastVisualTheme` (`basalt-rift`, `ion-shaft`, `nadir-glow`) | Walls/floors/ceilings use **distinct recipes** from W1 zone IDs |
| Copy & banner | `RaycastPresentation`, atmosphere messages | **“NOT THE FORGE”** / **ABYSS STRATUM** signal the narrative transition |
| Pacing | `RaycastWorldTwoLevels` director `config` per level | Recovery vs pressure **windows** authored per sector |

## Voice rules (copy)

- Prefer **stratum, rift, ion, nadir, shear, lattice (as structure)** over forge/slag/foundry when describing W2 spaces — unless contrasting (“not the forge”).
- Boss and combat strips stay **terminal / telemetry**; Phase 28+ audio and setpiece cues remain additive, not replacements.

## Constraints (non-goals)

- No renderer rewrite; no new enemy kinds for identity; no large procedural generators; no inventory/meta changes for this thread.

## Phase closure

Phase **31** formalizes and tightens the direction started in Phase **22** and content blocks through Phase **30**. See [`../phases/phase-31-world-2-final-identity.md`](../phases/phase-31-world-2-final-identity.md).
