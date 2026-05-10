# Portfolio & demo shot list (Phase 27A)

Use this list so captures stay **consistent** (same resolution path: `npm run dev`, browser **960×540** or **1280×720** window with Phaser FIT scaling — pick one and reuse). Hide browser chrome; **debug HUD off** (`TAB` unless you intentionally show it). Pointer lock is optional for static shots (click canvas once if the scene expects focus).

---

## Screenshots (target: **5**)

### 1. `raycast-menu.webp`

| | |
|---|---|
| **Purpose** | First impression: product framing (3D episode vs 2D arena, difficulty line). |
| **Must show** | Title, **Press A: 3D Mode**, **Press B: 2D Arena**, difficulty hint (`[D] CYCLE`). |
| **Moment** | `MenuScene` after fade-in (~0.5–1 s on menu). |
| **How** | Launch game → wait on menu → capture. |

### 2. `raycast-prologue.webp`

| | |
|---|---|
| **Purpose** | Narrative / tone — terminal corruption, clean-room disclaimer via copy. |
| **Must show** | Prologue body text + continue/back lines (raycast copy). |
| **Moment** | `PrologueScene` right after pressing **`A`** from menu, before second **`A`**. |
| **How** | From menu press **`A`** → capture before continuing. |

### 3. `raycast-sector-hud.webp`

| | |
|---|---|
| **Purpose** | Core gameplay readability: raycast view + HUD + objective. |
| **Must show** | First-person view, crosshair, health/objective strip, weapon line — ideally a readable corridor. |
| **Moment** | `RaycastScene` sector 1, **~2–4 s** after leaving prologue (second **`A`** / Space / Enter). |
| **How** | Prologue → continue → small movement forward so the frame is not empty black/wall-only. |

### 4. `raycast-combat-director.webp`

| | |
|---|---|
| **Purpose** | Action + systems story: combat feedback and pressure (director / encounter). |
| **Must show** | Enemy/billboard or hit feedback visible; HUD still readable. |
| **Moment** | First or second combat pocket after engagement starts (not menu/prologue). |
| **How** | Play until an encounter triggers; capture mid-fight or right after kill flash. |

### 5. `raycast-level-clear.webp`

| | | |
|---|---|---|
| **Purpose** | Run summary / scoring / replay loop — “serious product” proof. |
| **Must show** | Level-clear overlay with **══ SECTOR REPORT ══**, score/high score, rank line, time, combat/intel lines. |
| **Moment** | Exit trigger after objectives met — **`showRunCompleteOverlay`** (not death). |
| **How** | Complete one sector normally (or speed-run on easiest difficulty). Pause overlay; no cursor over text. |

**Bonus still (often automated):** `raycast-exploration.webp` — corridor read after a short forward walk; pairs with (3) for README grids.

**Optional swap:** If World 2 is part of the story you want to tell, add later: `raycast-world2-atmosphere.webp` (rift palette + banner visible).

---

## Animated GIFs (target: **2**)

### A. `raycast-boot-to-sector.gif` (~6–9 s loop or once-through)

| | |
|---|---|
| **Purpose** | Show the **full entry funnel**: menu → prologue → first sector in one glance (great for README / LinkedIn). |
| **Must show** | Menu → prologue screen → transition into playable raycast (brief walk optional). |
| **Moment** | Single continuous recording from cold menu; cut dead air at start/end. |
| **Encoding** | Keep width ≤ **720 px**, ~10–12 fps, duration under **12 s**, optimized palette (ffmpeg `palettegen`/`paletteuse`). |

### B. `raycast-combat-loop.gif` (~3–5 s)

| | |
|---|---|
| **Purpose** | Short “feel” clip: movement + firing + enemy reaction (director pressure optional). |
| **Must show** | Strafe or forward motion + at least one weapon discharge + readable HUD. |
| **Moment** | Any combat-heavy stretch in Episode 1 (sector 1–2). |
| **Encoding** | Same as above; prioritize **clarity** over length. |

---

## Checklist before committing assets

- [ ] Same aspect ratio / window size across all stills.  
- [ ] No personal bookmarks / browser UI in frame.  
- [ ] WebP or compressed PNG; total stills budget **< ~1.5 MB** when possible.  
- [ ] GIFs **< ~2–4 MB** each after optimization (shorter beats prettier).  

See [`README.md`](./README.md) in this folder for naming and optimization commands.
