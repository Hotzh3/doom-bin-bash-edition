# Animated GIFs (portfolio)

Optimized palette GIFs for README and social previews. **Do not** commit uncompressed screen recordings.

## Files

| File | Contents |
|------|----------|
| `raycast-boot-to-sector.gif` | Menu → terminal prologue → first sector (single capture session). |
| `raycast-combat-loop.gif` | Short segment from the same session — movement + firing. |

## Regenerate

From repo root (requires Playwright Chromium + **ffmpeg** on PATH):

```bash
npm run capture:media
```

Fine-tune trims in [`scripts/capture-portfolio.mjs`](../../../scripts/capture-portfolio.mjs) (`-t` duration, `-ss` offset, palette filters).

## Size targets

- Prefer **under ~1 MB** per GIF. Recent pipeline output landed around **~230 KB** (boot) + **~265 KB** (combat) — verify after each run with the script’s size summary or `wc -c docs/assets/gifs/*.gif`.
- Defaults: **8 fps**, **400 px** wide palette GIF; shorten trims before dropping resolution.
