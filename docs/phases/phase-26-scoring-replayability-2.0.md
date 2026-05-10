# Phase 26 — Scoring & Replayability 2.0

Skill-forward scoring and a readable **sector / run report** without touching maps, renderer, weapon curves, or World 2 content data.

## What already existed (Phase 24–25 baseline)

- Kill points, secret points, boss clear bonus, World 2 transition bonuses (`RaycastScore.ts`).
- Per-sector metrics: pellets, damage, secrets, boss pellet counts, **boss arena damage** (`runBossDamageTaken` in `RaycastScene`).
- Sector performance bonus (accuracy + survival + boss pellet efficiency) capped at **600**.
- Campaign completion bonus: pace under par, full secret sweep, low average damage, steady aim (`computeRaycastCampaignCompletionBonus`).
- Medals (sector + finale) and rank tiers from total score (`computeRaycastRunRank`).

## Phase 26 additions

### 26A — Instrumentation (verified, minimal new wiring)

- **Boss arena damage** already accumulated while `bossState.alive`; now **surfaced** in run summary as `BOSS DMG … (arena)` on boss maps.
- Campaign composite overlay includes **`BOSS DMG (RUN)`** when any boss sector was played (`cumulativeBossDamageTaken`).

### 26B — Formula & rank

- **Boss survivorship bonus:** sector performance adds up to **95** extra points from low `bossDamageTaken` during boss fights (`PERFORMANCE_BOSS_CLEAN_*`), still under the **600** sector performance cap with accuracy/survival/boss-efficiency parts.
- **Medal `BOSS_GRACE`:** sector clear with boss, ≥4 boss pellets fired, arena damage **≤34**.
- **Rank API:** `computeRaycastRunRankParts(score)` exposes **tier letter + subtitle** for aligned HUD lines; `computeRaycastRunRank` unchanged for full string consumers.

### 26C — Summary presentation

- **Aligned stat lines** via shared `padStat` helper — score uses thousands separators (`1,200`).
- Labels: **`DMG (YOU)`**, **`ACC (SECTOR)`**, **`BOSS EFF`**, **`BOSS DMG`** (arena), campaign **`RUN LOCK`** block uses same column discipline.
- **Replay hint** (one line) on **episode complete** overlays: `PUSH // Higher ACC, lower DMG, faster wall time → higher tier`.

## Formula sketch (readable)

```
Final score ≈ sum(kills, secrets, boss clears, transition bonuses)
           + Σ sector_performance (≤600 each)
           + optional arc / finale bonuses
```

Sector performance components (each capped, combined capped):

1. **Accuracy** — pellet hits / pellets fired (minimum shots gate).
2. **Survival** — low total damage taken in sector.
3. **Boss efficiency** — boss pellet hits / boss pellets fired (minimum shots gate).
4. **Boss grace** — low damage taken **during boss lifetime** (new in Phase 26).

## Files touched

| File | Change |
|------|--------|
| `RaycastScore.ts` | Boss-clean slice of performance bonus; `BOSS_GRACE` medal + label |
| `RaycastRunSummary.ts` | `computeRaycastRunRankParts`, `padStat`, formatting, campaign boss DMG line, replay hint |
| `RaycastScene.ts` | Pass `bossArenaDamageTaken` into summary input |
| Tests | `raycast-score`, `raycast-run-summary` |

## Out of scope (per request)

- Map edits, renderer, base weapon balance, World 2 level data.
- Meta progression beyond local high score.

## Next steps (optional)

- Per-difficulty rank thresholds (requires playtest matrix).
- Tiny icons or color tokens for medals in overlay (would touch presentation minimally).
