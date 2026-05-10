# Release Checklist

Use this before a demo, handoff, or PR.

## Required Commands

```bash
npm run test
npm run lint
npm run build
```

## Manual Smoke

- Launch with `npm run dev`
- Start the raycast episode from menu with **`A`** or click **3D Mode**
- Verify move / turn / fire / weapon swap
- Verify token pickup, door open, at least one trigger, and one level exit
- Verify level-clear or episode-clear overlay instructions
- Return to menu with `ESC`
- Launch `ArenaScene` with **`B`**
- Verify arena still restarts and basic combat still works

## Browser Checks

- Open browser devtools once during the smoke pass
- Confirm there are no console errors
- Confirm there are no missing local asset requests or 404s

## Clean-Room Messaging

- Describe the game as an original retro horror raycast FPS
- Say inspiration is limited to classic genre feel, not copied content
- Do not imply Doom or Doom 64 assets, maps, code, names, or content are present

## Portfolio media (recommended before external demos)

- Stills / GIFs live under `docs/assets/screenshots/` and `docs/assets/gifs/` ([shot list](../assets/screenshots/SHOT_LIST.md)).
- After UI or raycast visual changes, refresh: `npx playwright install chromium` (once per machine) then `npm run capture:media` (needs `ffmpeg` on `PATH`). Use **`CAPTURE_URL=...`** if Vite is already running — see [`scripts/capture-portfolio.mjs`](../../scripts/capture-portfolio.mjs).
- The capture script prints **per-file sizes** when it finishes; align root [`README.md`](../../README.md) subline with combined WebP + GIF totals.
- Quick sanity check: five WebPs typically **~95–110 KB** combined; two GIFs **under ~1 MB** each (recent passes ≈ **~230 KB + ~265 KB** — rerun `capture:media` and update [`README.md`](../../README.md) if totals shift).
- Verify relative links: README references `docs/assets/screenshots/*.webp`, `docs/assets/gifs/*.gif`, and [`docs/assets/doombanner-cover.png`](../assets/doombanner-cover.png) — `ls` those paths before tagging.

## Handoff Links

- Demo script: [docs/demo/raycast-demo-script.md](./raycast-demo-script.md)
- Manual feel checklist: [docs/playtest/raycast-feel-checklist.md](../playtest/raycast-feel-checklist.md)
- Portfolio / release readiness: [docs/phases/phase-25-release-readiness.md](../phases/phase-25-release-readiness.md)
- Documentation index: [docs/README.md](../README.md)
