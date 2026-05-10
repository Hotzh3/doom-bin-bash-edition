# Animated GIFs (portfolio)

Optimized palette GIFs for README and social previews. **Do not** commit uncompressed screen recordings.

## Files

| File | Contents |
|------|----------|
| `raycast-boot-to-sector.gif` | Menu → terminal prologue → first sector (single capture session). |
| `raycast-combat-loop.gif` | Short segment from the same session (~4 s from mid-run) — movement + firing. |

## Regenerate

From repo root (requires Playwright Chromium + `ffmpeg` on PATH):

```bash
npm run capture:media
```

Fine-tune trims in `scripts/capture-portfolio.mjs` (`-ss`, `-t`, palette filters).

## Size targets

- Prefer **under ~1 MB** per GIF when possible (resolution ≤ ~640 px wide, fps ~10–12).
- If GIFs grow large, reduce duration before lowering resolution.
