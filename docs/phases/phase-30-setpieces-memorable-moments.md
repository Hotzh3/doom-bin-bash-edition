# Phase 30 — Setpieces & memorable moments

## Goal

Ship **authored, memorable beats** using existing presentation surfaces (corruption veil, combat strip, feedback pulse, procedural audio) — **no** cinematics pipeline, **no** renderer rewrite, **no** new scenes.

## Impact vs cost (pre-pass)

| Idea | Cost | Ship? |
|------|------|--------|
| Alarm / breach stinger stack | Low — audio + timed pulses | Yes (`ALARM_SURGE`) |
| Blackout beat | Low — veil alpha + dark camera flash | Yes (`BLACKOUT_PULSE`) |
| Ritual / vault read | Low — corruption pulse + tint | Yes (`RITUAL_PULSE`) |
| Fake safety | Low — recovery tint then tension elsewhere | Yes (`FAKE_CALM`) |
| Corridor / ridge hunt | Low — warning + deny ping | Yes (`CORRIDOR_HUNT`) |
| Collapsing bridge / flooding sim | High — needs geometry or fake physics | **No** (copy-only “drain surge” via blackout) |
| Full arena lockdown UI | Medium — overlaps boss exit gating | Deferred |

## Delivered subphases

### 30A — Setpiece bible

- [`../design/setpiece-bible.md`](../design/setpiece-bible.md) — cue vocabulary + level wiring table.

### 30B — First implementation surface

- **`RaycastSetpieceCue`** + helpers in [`src/game/raycast/RaycastSetpiece.ts`](../../src/game/raycast/RaycastSetpiece.ts).
- Optional **`setpieceCue`** on [`RaycastEncounterBeat`](../../src/game/raycast/RaycastLevel.ts) and [`RaycastTrigger`](../../src/game/raycast/RaycastLevel.ts).
- **`RaycastScene.stageSetpieceCue`** — executes cue after encounter messages / alongside trigger activation.

### 30C — Authored placements

- **Episode 1 — Slag Foundry:** gate ambush (`ALARM_SURGE`), south drain trap (`BLACKOUT_PULSE`), east decoy exit beat (`FAKE_CALM`).
- **World 2 — Sulfur Lattice:** conduit surge (`ALARM_SURGE`), cache stir (`CORRIDOR_HUNT`), bloom archive zone (`RITUAL_PULSE`).

## Legibility & pacing risks

- **Audio stacking:** triggers still run director ambush audio; cues add warning/sting — kept volumes conservative.
- **Fake calm:** deliberately contradicts prior warning tone; one-shot per run when entering decoy zone.

## Validation

- `npm run test && npm run lint && npm run build`
- Manual smoke: trigger **gate-ambush**, enter **bloom-archive**, walk **east-exit-snare** on Foundry.

## Relation to Sulfur Stratum content

World 2 sulfur crawl + Bloom Warden pit remain defined in [`../biome-phase30-sulfur-stratum.md`](../biome-phase30-sulfur-stratum.md). This phase adds **presentation hooks** on top of that authored route without changing progression IDs.
