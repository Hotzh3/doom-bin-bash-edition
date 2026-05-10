# Phase 29 — Enemy identity & tactical depth

## Goal

Make each hostile **readable at a glance**: silhouette/contrast, a clear tactical role, and fair telegraphs—without a renderer rewrite, new meta systems, or a large AI overhaul.

## Analysis (29A) — prior state

| Kind | Role problem | Fairness notes |
|------|----------------|----------------|
| **GRUNT** | Generic filler | Predictable melee cadence; fine as baseline pressure. |
| **BRUTE** | Tank read OK | Slow windup already telegraphs; needed stronger **spatial denial** read (size). |
| **STALKER** | “Purple blur” | Very short windup could feel sudden at melee range. |
| **RANGED** | Lane threat | Long windup good for HUD `ARMED`; projectile speed could shrink dodge window vs windup. |

## What shipped

### Roles & HUD (29B)

- **`EnemyConfig.tacticalRole`** — `PRESSURE | DENIAL | FLANK | ZONE_DENIAL` with compact HUD tags (`PRS`, `DEN`, `FLK`, `ZONE`).
- **`formatRaycastEnemyTargetLabel`** — crosshair / target strip shows e.g. `STALK·FLK`.
- Director spawn strip includes role: `HOSTILE SIGNAL DETECTED: GRUNT (PRS)`.

### Silhouette & telegraph tuning (29C)

Raycast profile only (arena unchanged):

- **GRUNT** — slightly larger billboard (`size` 29) for baseline readability.
- **BRUTE** — `size` 40 so bulk denial reads from distance.
- **STALKER** — `size` 26 + **`attackWindupMs` 100** (was 80) for fairer melee read.
- **RANGED** — **`attackWindupMs` 430** (was 400) + **`projectileSpeed` 300** (was 315) so dodge window stays honest vs travel time.

### Ensemble synergy (director)

- **`aliveEnemyKindCounts`** passed from `RaycastScene` into `GameDirector`.
- **`pickPressureEnsembleKind`** during director **PRESSURE** only (after weapon counters):  
  - brute on field, no ranged → spawn **RANGED** (lanes behind the anchor).  
  - two+ stalkers, no brute → spawn **BRUTE** (anchor vs pure-speed stacking).

## Constraints

- No procedural map / renderer / inventory / meta changes.
- Synergy is a **small pure function** + one input field—no parallel AI system.

## Validation

- `npm run test && npm run lint && npm run build`

See [`../design/enemy-role-bible.md`](../design/enemy-role-bible.md) for counterplay summary.
