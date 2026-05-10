# Encounter grammar — design notes

Companion to **Phase 27** — operational vocabulary for **authored** raycast sectors.

## Layers (stack)

1. **Macro objective** — Fixed pipeline in `RaycastObjective.ts` (do not fork per level).
2. **Topology** — `RaycastMap.grid` + player loop routes (safe trench vs exposed shaft).
3. **Scripted beats** — `triggers[]` rectangles + `spawns` (composition & order).
4. **Director** — Reinforcement cadence when scripted waves exhaust (`DirectorConfig` per level).
5. **Voice** — `encounterBeats[]` + HUD objective flavour (`hudObjectiveLabels`).

## Template phrases (reuse)

- **Choke anchor:** replace second filler with **`BRUTE`** in narrow triggers.
- **Trap drain:** add **`BRUTE`** late in wide southern rectangles — reads “room wakes up”.
- **EXIT? pad:** duplicate exit with **same** progression rules → shortcut after clearance; teach with zone beat + `EXIT?` label.
- **Holdout:** ↑ `ambushDurationMs` or `maxEnemiesAlive` **without** touching enemy AI.
- **Fork copy:** two zones with conflicting advice (cache vs sigil, trench vs shaft).

## Anti-patterns

- Two **`doorId`** beats on the **same** door open — only the first fires once; chain with **`zoneId`** after traverse instead.
- Outer zone before inner zone in `zones[]` — breaks **`zoneId`** encounter beats.

## Balance caution

Adding spawns increases kill-score and director pressure — pair with **recovery** beats or modest pickup placement when tightening.
