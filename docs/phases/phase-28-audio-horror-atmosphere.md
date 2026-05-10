# Phase 28 — Audio horror & atmosphere

## Goal

Raise tension and dread **through audio only**: drones and ambience beds, industrial corruption, short stingers, boss phase transitions, and **longer quiet intervals** during director recovery—without loud spam, HUD clutter, or combat/score refactors.

## What shipped

### 28A — Ambience base

| Cue | Role |
|-----|------|
| `ambientIndustrial` | Pressure / boss-pit bed: low saw/square machinery grit (replaces generic `ambient` in those contexts). |
| `ambientCorrupt` | World 2 ion stratum: low sine + HF whisper + mid scrape (replaces `ambient` when segment is `world2`). |
| `ambient` | Still default for calm World 1 exploration. |

**Scene wiring:** `RaycastScene.updateAtmospherePulse()` chooses cue by boss active → director pressure → world segment. Recovery state stretches pulse interval to **~13.2s** for intentional silence after spikes.

### 28B — Stingers & boss transition

| Cue | Role |
|-----|------|
| `bossPhaseShift` | Phase 2 transition: sub-heavy sweep + harmonics (distinct from `directorAmbush`, which remains for AI director ambush events). |
| `stingerDread` | Thin harmonic stab **~42ms after** `directorWarning` when a boss telegraph **begins** (throttled per cue). |

**HUD:** Boss combat strip lines use `getRaycastBossHudLines(displayName)` so **Bloom Warden** gets bloom/warden copy instead of hardcoded Archon strings.

### 28C — Damage & danger feedback

| Change | Role |
|--------|------|
| Hit intensity scales with `appliedDamage` (and slightly higher cap during boss) | Large hits read heavier without new cue types. |
| `lowHealthWarning` third layer | Brief high harmonic decay on low-health warnings. |

## Constraints respected

- No renderer changes; no map edits.
- Procedural cues stay **short** (layers ≤ 250ms, volumes capped as in `audio-feedback.test.ts`).
- Throttles on new cues prevent stacking spam when combined with director audio.

## Validation

- `npm run test && npm run lint && npm run build`

See also: [`../design/audio-atmosphere-target.md`](../design/audio-atmosphere-target.md).
