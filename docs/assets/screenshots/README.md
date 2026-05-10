# Gameplay screenshots (portfolio)

Real **in-game** captures for README, talks, and résumé links. Not moodboard art (`docs/assets/im*.png`).

## Naming convention

Pattern: **`raycast-{moment}-{subject}.webp`** (lowercase, hyphenated).

| File | Role |
|------|------|
| `raycast-menu.webp` | Main menu — mode split + difficulty. |
| `raycast-prologue.webp` | Terminal prologue copy. |
| `raycast-sector-hud.webp` | First-person HUD + objective (sector start). |
| `raycast-exploration.webp` | Movement / corridor readability (README grid). |
| `raycast-combat-director.webp` | Combat beat — pacing / feedback visible. |
| `raycast-level-clear.webp` | Level-clear overlay with sector report *(manual capture — see [`SHOT_LIST.md`](./SHOT_LIST.md)).* |

Stills are **WebP** (~960×540 logical game frame). Regenerated PNG intermediates should not be committed.

## Capture checklist

1. `npm run dev` — fixed window size (**960×540** outer viewport matches canvas intent), **or** run `npm run capture:media` (starts Vite automatically).
2. Browser chrome hidden; **debug HUD off** (`TAB`).
3. Follow **[SHOT_LIST.md](./SHOT_LIST.md)** for intent per frame.

### Level-clear still (`raycast-level-clear.webp`)

Not produced by `capture:media` (needs a full sector exit). Complete any sector, pause on the clear overlay, capture once.

## Automated pipeline

```bash
npx playwright install chromium   # once per machine
npm run capture:media
```

Uses Playwright + **sharp** (WebP). The script logs **per-file and combined** sizes when it finishes. Requires **ffmpeg** on `PATH` for GIF output.

**Already running Vite?** `CAPTURE_URL=http://127.0.0.1:5173 npm run capture:media`

## Manual optimization

If WebP needs trimming further: re-export from source PNG with `sharp` quality ~78–82, or run **pngquant** on PNG intermediates before WebP.
