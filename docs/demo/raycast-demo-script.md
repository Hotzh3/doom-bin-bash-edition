# Raycast Demo Script

## Purpose

Use this script for demos, playtests, and handoff reviews of the current vertical slice:

- Primary mode: original raycast FPS mini episode in `RaycastScene`
- Secondary mode: preserved 2D `ArenaScene` sandbox for regression safety
- Scope: presentation, controls, pacing, clean-room positioning, and smoke coverage

## How To Run

```bash
npm ci
npm run dev
```

Open the local Vite URL in a browser. Keep the browser console visible during at least one smoke run to confirm there are no runtime errors or asset 404s.

## What To Show First

1. Start at the menu.
2. Point out that `SPACE` starts the main raycast episode and `A` opens the secondary arena sandbox.
3. Start the raycast episode with `SPACE`.
4. Show movement, turning, shooting, weapon swap, HUD objective changes, and the level-complete flow.
5. Finish the second level or use a prepared save state / quick run to show the episode-complete overlay.
6. Return to menu and open `ArenaScene` briefly to prove the sandbox still works and remains secondary.

## Concise Controls

### Raycast Episode

- Move: `WASD`
- Turn: mouse horizontal, `Q`/`E`, or left/right arrows
- Fire: click, `F`, or `SPACE`
- Weapons: `1`, `2`, `3`
- Restart current level: `R`
- Next level when clear overlay is active: `N`
- Return to menu: `ESC`
- Toggle debug: `TAB` or backtick

### Arena Sandbox

- Restart arena: `R`
- Player 1: `WASD` + `F`
- Player 2: arrows + `L`

## What To Test During The Demo

- The menu clearly frames the raycast episode as the main experience.
- HUD text stays readable while moving, fighting, and collecting tokens.
- Doors, keys, secrets, ambush triggers, and exits all still work.
- Level-clear and episode-clear overlays provide obvious next-step instructions.
- `ESC` returns to menu cleanly from the raycast mode.
- `ArenaScene` still launches and plays as a secondary sandbox.
- No browser console errors appear during a normal run.

## Clean-Room / Original Positioning

Use language like this:

`This is a clean-room original project. It aims for a classic retro horror raycast FPS feel, but it does not reuse Doom or Doom 64 code, assets, names, maps, sprites, sounds, or copyrighted content.`

Follow with:

`The inspiration is limited to high-level feel targets like movement clarity, pressure pacing, and readable horror atmosphere. Everything in the current slice is original to this repo.`

## 2-3 Minute Demo Script

### Minute 0-1

Start on the menu and say:

`The primary experience is this original two-level raycast episode. The arena is still here as a secondary sandbox for older systems and regression coverage.`

Launch with `SPACE`. Show movement, turning, and immediate firing. Mention that the game is tuned around constant motion, readable pressure, and short-session clarity.

### Minute 1-2

Collect a token, open a door, and trigger at least one combat beat. Point out the compact HUD, generated audio feedback, and `GameDirector` pacing between calm, warning, pressure, and recovery.

### Minute 2-3

Reach a level exit or a prepared level-clear state. Show that the overlay explains whether to go next, replay, or return to menu. If time allows, finish the second level and note that the episode summary closes the mini episode without disabling the arena sandbox.

## 10-Minute Playtest Script

### 0-2 Minutes

- Launch from menu into the raycast episode.
- Verify controls, pointer lock, shooting, and weapon switching.
- Check the browser console for errors once the scene is active.

### 2-5 Minutes

- Play level 1 normally.
- Verify token pickup, locked-door messaging, door opening, and at least one trigger or ambush.
- Confirm the objective text changes as progress is made.

### 5-8 Minutes

- Advance to level 2.
- Verify the next-level handoff, HUD persistence, director pacing, and final-level readability.
- Intentionally take damage once to confirm feedback is still readable.

### 8-10 Minutes

- Complete the episode or reach the finale overlay.
- Test `R` restart, `ESC` menu return, and re-entry from the menu.
- Open `ArenaScene` with `A` and perform a quick smoke pass.

## Suggested Talking Points

- Original clean-room implementation, retro horror tone, and no external gameplay assets
- `GameDirector` pacing keeps the short episode dynamic without requiring a large content set
- Two linked original levels make the project easier to present than an endless sandbox alone
- `ArenaScene` remains useful as a compatibility sandbox while the raycast mode is the main product direction
