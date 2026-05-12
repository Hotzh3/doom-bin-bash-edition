# Capture Guide

This guide defines the portfolio media workflow for `doom-bin-bash-edition`.
All captures must be **in-engine**, browser-friendly, and consistent with the
project's clean-room positioning.

## Goals

- Produce real gameplay media, not concept art or mock renders.
- Keep screenshot composition consistent across the set.
- Capture the game in a way that highlights clarity, mood, and authored pacing.
- Make the media easy to reuse in README, PDF portfolio reports, and release notes.

## Canonical folder structure

```text
docs/assets/
  screenshots/
  gifs/
  cover/
docs/media/
  capture-guide.md
```

Recommended asset paths:

- screenshots: `docs/assets/screenshots/*.webp`
- GIFs: `docs/assets/gifs/*.gif`
- raw intermediates: keep uncommitted in a temp folder or `docs/.capture/`

## Naming conventions

Use a consistent, descriptive pattern:

- screenshots: `raycast-{moment}-{subject}.webp`
- GIFs: `raycast-{sequence}.gif`

Rules:

- lowercase only
- hyphen-separated
- no spaces
- no version numbers in filenames
- avoid “final-final” style naming

Examples:

- `raycast-menu.webp`
- `raycast-hud.webp`
- `raycast-combat-director.webp`
- `raycast-boss-bloom-warden.webp`
- `raycast-minimap.webp`
- `raycast-world2-atmosphere.webp`
- `raycast-run-summary.webp`
- `raycast-setpiece-blackout.webp`
- `raycast-progression.webp`
- `raycast-boot-to-sector.gif`
- `raycast-combat-loop.gif`

## Capture staging

Capture in stages so the final set stays coherent:

1. **Baseline menu pass**
   - menu
   - runtime footer
   - mode selection

2. **Early run pass**
   - HUD
   - progression
   - minimap
   - corridor readability

3. **Combat pass**
   - combat
   - director pressure
   - setpiece beats

4. **Boss pass**
   - Bloom Warden arena
   - boss silhouette
   - wow reveal moment

5. **Wrap-up pass**
   - run summary
   - rank
   - score breakdown
   - World 2 identity frame

This staging keeps the set from feeling like random screenshots taken at unrelated
times of day.

## Recommended framing

Use one stable capture geometry for every still:

- viewport: `960×540`
- browser chrome: hidden
- debug HUD: off
- composition: center-weighted, with readable foreground silhouette

Recommended camera framing:

| Capture     | Framing guidance                                         |
| ----------- | -------------------------------------------------------- |
| Menu        | Center the mode split and runtime footer                 |
| HUD         | Keep crosshair, health, and objective visible            |
| Combat      | Show enemy threat, muzzle flash, and HUD at once         |
| Boss        | Frame the arena shape first, boss silhouette second      |
| Minimap     | Keep the minimap readable without overpowering the frame |
| World 2     | Emphasize color separation and depth cues                |
| Wow moment  | Favor reveal corridors or arena transformations          |
| Run summary | Keep score, rank, and par time legible                   |
| Setpiece    | Show the lighting state change clearly                   |
| Progression | Show route continuity, doors, keys, or objective shift   |

## Screenshot shot table

| Priority | File                             | What it should communicate                       | Capture note                                 |
| -------- | -------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| P1       | `raycast-menu.webp`              | First impression, mode split, runtime confidence | Static, clean, no clutter                    |
| P1       | `raycast-hud.webp`               | Core FPS readability                             | Show the actual loop, not a dead hallway     |
| P1       | `raycast-combat-director.webp`   | Combat pressure and feedback                     | Capture during active engagement             |
| P1       | `raycast-boss-bloom-warden.webp` | Authored boss identity                           | Boss arena should read immediately           |
| P1       | `raycast-run-summary.webp`       | End-state, rank, score clarity                   | Ensure the overlay is fully visible          |
| P1       | `raycast-world2-atmosphere.webp` | World 2 identity                                 | Lean into cold ion / abyss palette           |
| P2       | `raycast-minimap.webp`           | Navigation and spatial structure                 | Capture when the map is informative          |
| P2       | `raycast-progression.webp`       | Doors, keys, route continuity                    | Show a meaningful route change               |
| P2       | `raycast-setpiece-blackout.webp` | Setpiece rhythm                                  | Capture during a lighting-state shift        |
| P2       | `raycast-wow-reveal.webp`        | Memorability                                     | Use the best reveal corridor or arena reveal |

## GIF capture plan

GIFs should explain motion, not replace screenshots.

Recommended GIF set:

| File                         | Duration | Purpose                                            |
| ---------------------------- | -------- | -------------------------------------------------- |
| `raycast-boot-to-sector.gif` | 5-7 s    | Menu to play funnel, for README and social preview |
| `raycast-combat-loop.gif`    | 2-4 s    | Movement + fire + HUD loop                         |
| `raycast-boss-beat.gif`      | 4-6 s    | Boss arena identity and pressure                   |
| `raycast-world2-reveal.gif`  | 3-5 s    | World 2 reveal / wow moment                        |

GIF guidance:

- keep them short
- prioritize stable camera motion
- do not over-compress the palette
- avoid UI flicker during transitions

## Mood consistency

The media set should feel like one project, not four unrelated scenes.

Consistency rules:

- Use the same viewport and aspect ratio everywhere.
- Keep the same browser zoom and capture pipeline.
- Favor frames where the player can read threat, route, and objective quickly.
- Keep World 2 shots cold, blue-violet, and abyssal.
- Use setpieces to show lighting hierarchy rather than random visual noise.
- Avoid frames where the HUD is obscured or the screen is mid-transition unless the transition itself is the subject.

## Capture quality checklist

- [ ] Real in-engine capture only
- [ ] No concept art or mocked UI
- [ ] Same aspect ratio across the set
- [ ] Browser chrome hidden
- [ ] Debug HUD off
- [ ] HUD legible
- [ ] World 2 shots visibly distinct from World 1
- [ ] Boss frame shows arena identity, not just the boss
- [ ] Run summary is readable end-to-end
- [ ] GIFs remain lightweight and smooth in-browser

## Capture workflow

1. Run the build or dev server.
2. Capture baseline menu and HUD frames.
3. Stage a combat pass for pressure and feedback.
4. Stage boss and World 2 reveal shots.
5. Capture run summary last, when the playthrough is complete.
6. Export WebP stills and optimized GIFs.
7. Verify sizes and naming before committing.

## Notes

- Prefer composition over quantity.
- One strong frame is better than three average ones.
- If a shot is confusing, it is usually not a good portfolio image.
- Screenshots should support the story told by the README and the final report.
