# Phase 27 — Encounter grammar & level design

**Goal:** Levels read as **authored spaces** (arenas, forks, trap pockets, risky shortcuts) instead of a flat “token → seal → ambush → hatch” loop — **without** new combat AI, procedural maps, or renderer work.

## Why flows felt repetitive

1. **Objective machine is canonical** (`FIND KEY → OPEN DOOR → SURVIVE AMBUSH → EXIT`) — intentional for HUD/tests.
2. **Differentiation** must come from **geometry + trigger choreography + director windows + copy** (`encounterBeats`).
3. Episode maps shared similar **trigger ladders** (gate trigger + overlook trigger + optional cache).

## Grammar v1 (Phase 27 shipped patterns)

| Pattern | Player read | Implementation |
|---------|----------------|------------------|
| **Dual exit / EXIT?** | Same clearance rules on both pads; early arrival sees denial — shortcut once route armed | Second `exits[]` entry — **access-node** (`EXIT` roof + `EXIT?` east sleeve) |
| **Trap pocket** | Anchor brute + rifles / stalkers in confined tiles | Extra **`BRUTE`** in drain + lateral choke triggers |
| **Holdout tuning** | Slightly longer ambush pressure window, one more live slot | Director **`maxEnemiesAlive`**, **`ambushDurationMs`**, cooldown tweaks |
| **Risk fork (copy)** | Safe trench vs exposed sigil room | Zone **`encounterBeats`** on **cistern** / **ion-run** |
| **World 2 pulse** | Fourth scripted flank on seam tear | Extra scripted spawn in **`rift-split-push`** |

## Files touched

| Area | Changes |
|------|---------|
| **`RaycastLevel.ts`** | Episode **access-node** — zones (`east-exit-snare` **before** `east-overlook` for hit-test order), dual exits, trigger mixes, director pacing, encounter beats; **glass-cistern** — secret-trap spawn + beat + `debugEnabled: false` |
| **`RaycastWorldTwoLevels.ts`** | **Fracture** — split-push quartet spawn, ion-run beat, director holdout timing |
| **`raycast-level.test.ts`** | Exits `>= 1`; dual-exit hub assertion |

## Zone ordering note

`findRaycastZoneId` returns the **first** matching rectangle. **Inner** pads (e.g. snare around **EXIT?**) must appear **before** outer overlapping zones in `zones[]`.

## Pending / not done

- Per-level **fake exit** that uses different `progression` — would need engine support or bespoke scripting.
- **New landmark IDs** in renderer theme tables — avoided; reused existing `RaycastZoneThemeId` / landmarks.
- Deep rebalance of Episode **levels 3–5** director curves — scope contained to hub + cistern + W2 fracture.

## Related

- Design companion: [`../design/encounter-grammar-notes.md`](../design/encounter-grammar-notes.md)
- Historical context: [`../phase23-encounter-grammar-boss.md`](../phase23-encounter-grammar-boss.md)
