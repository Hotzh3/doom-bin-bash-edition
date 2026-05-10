# Biome bible (raycast — authored worlds)

Cross-cutting **fantasy + visual rules** for World 1–3. Implementation lives in `RaycastVisualTheme`, `RaycastAtmosphere`, `RaycastPalette`, and level `zones[].visualTheme`.

## World 1 — Fracture threshold (baseline)

- **Read:** industrial fracture, baseline HUD fog, teaching corridors.
- **Role in arc:** Episode 1 primary chain; establishes pellet economy and door/key grammar.

## World 2 — Ion stratum / sulfur extension

- **Read:** **cold** ion fog, toxic-yellow pockets, lattice crawl → pit finale.
- **Canonical detail:** [`world2-identity-bible.md`](./world2-identity-bible.md), [`biome-phase30-sulfur-stratum.md`](../biome-phase30-sulfur-stratum.md).
- **Landmarks:** basalt shaft, toxic bloom archive, Bloom Warden pit.

## World 3 — Ember Meridian (Phase 34)

- **One-line identity:** **Warm ash conduit beneath the cold stratum** — “third hell,” patience-taxing harassment corridors before a **judgment** duel.
- **Tonality:** telemetry voice stays mission-brief; copy emphasizes **ember heat, ash patience, vent seals** (not sulfur bloom).
- **Visual zones:** `ash-conduit` (paths, seals), `ember-vault` (archives, arenas, boss shell).
- **Atmosphere:** `RAYCAST_ATMOSPHERE_WORLD3` + segment layer warms fog and scales veil pulses — distinct from `RAYCAST_ATMOSPHERE_WORLD2`.
- **Landmarks:** Cinder Ramp (LEVEL_1 grid), Gate Cut (LEVEL_5 grid), Ash Judge seal (`RAYCAST_MAP_BOSS`).

### Authoring rules (World 3)

| Rule | Rationale |
|------|-----------|
| Pair **SCRAMBLER** with anchors (`BRUTE`) or lane denial (`RANGED`) | Teaches **peel order** — harassment without a clock is noise. |
| Use **one setpiece cue** per major beat | Keeps alarm/ritual reads rare and loud. |
| Secrets → **score / medal spine** | Impact without new inventory systems. |

### Forbidden / discouraged

- Replacing World 2 palette tokens globally — worlds must remain **side-by-side readable** in a full arc run.
- Painting entire maps ember-orange — use **conduit vs vault** contrast for landmarks.

## Full-arc player fantasy

Fracture → cold stratum crawl → **descend into ember meridian** → Ash Judge **verdict** volleys. Pacing: authored triggers + director on crawl sectors; **director off** on boss arena (existing boss pattern).
