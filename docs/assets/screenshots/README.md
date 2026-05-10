# Gameplay screenshots

Add **real gameplay captures** here for README / portfolio (not moodboard art).

## Naming convention

Use lowercase with hyphens, WebP or compressed PNG:

- `menu.png` or `menu.webp` — main menu with options visible  
- `raycast-hud-combat.webp` — combat + HUD  
- `level-clear.webp` — victory overlay with summary lines  
- `minimap.webp` — optional, if showcasing map readability  

## How to capture

1. Run `npm run dev`, use a fixed window size (e.g. 1280×720) for consistency.  
2. Hide browser UI for capture; avoid debug HUD unless intentional (`TAB` off).  
3. Optimize images (e.g. `pngquant`, `cwebp`) before committing to keep the repo lean.  

Update the **Gameplay Screenshots** section in the root `README.md` with `<img>` tags pointing here once files exist.
