<p align="center">
  <img src="docs/assets/doombanner-cover.png" width="100%" alt="DOOM BIN BASH EDITION cover"/>
</p>

# doom-bin-bash-edition

**Browser-playable retro-horror raycast FPS** built with **Phaser 3**, **TypeScript**, and **Vite**. The **main product story** is **`RaycastScene`**: terminal prologue, **Episode 1** (five sectors + boss finale), optional **World 2** (four authored sectors) and **World 3** (three-sector ember arc when the progression allows), plus local **score / high score** and run summary. **`ArenaScene`** remains a **secondary** 2D sandbox for regression and local multiplayer — not the portfolio headline.

**Engineering:** **Vitest** for core logic, **ESLint**, production **Vite** build, **GitHub Actions** CI.

**Media:** Reference captures live under `docs/assets/`; this README stays text-first. A concrete capture wishlist is in [`docs/demo/screenshots-plan.md`](docs/demo/screenshots-plan.md).

## Delivery Status

- ![CI](https://github.com/Hotzh3/doom-bin-bash-edition/actions/workflows/ci.yml/badge.svg) CI
- ![Release](https://github.com/Hotzh3/doom-bin-bash-edition/actions/workflows/release.yml/badge.svg) Release artifacts
- CD - GitHub Pages configured for `dist/`; requires `Settings -> Pages -> Source: GitHub Actions`.

Expected Pages URL:

- [https://Hotzh3.github.io/doom-bin-bash-edition/](https://Hotzh3.github.io/doom-bin-bash-edition/)

Deployment docs:

- [docs/runtime/deployment.md](docs/runtime/deployment.md)
- [docs/runtime/cicd-validation.md](docs/runtime/cicd-validation.md)

---

## Disclaimer

Portfolio / learning project. Inspired by the **feel** of classic retro FPS; **not** affiliated with Doom or Doom 64. No reuse of their code, assets, maps, names, sprites, sounds, or copyrighted content.

## Clean-room boundary

No copied gameplay assets, maps, proprietary data, or reverse-engineered implementations. References are **high-level only** (movement clarity, strafe play, pacing, readable horror atmosphere). Layouts, tuning, names, and visuals here are original.

---

## Implemented today (honest scope)

What you can actually play and show:

| Area | What ships |
|------|------------|
| **Raycast renderer** | Column raycasting, procedural wall/floor styling, atmosphere (fog, corruption tint), billboards for pickups/doors/exits — **no** external texture packs. |
| **Combat** | Hitscan weapons, damage feedback, enemy projectiles where authored, basic knockback/flash presentation hooks — **not** a full tactical sim. |
| **AI director** | `GameDirector` pacing (calm → pressure → ambush → recovery, etc.) tuned per level; spawns and tension staging. |
| **Encounters** | Authored beats, triggers, optional encounter-pattern hooks for variety — scope is **vertical slice**, not endless modes. |
| **Enemy roles** | Kinds: `GRUNT`, `STALKER`, `RANGED`, `BRUTE`, `SCRAMBLER` with different silhouettes/roles in raycast presentation. |
| **Boss** | Episode finale boss (e.g. **Volt Archon**) with phased fight and HUD strings; additional bosses in later worlds when reached. |
| **Score / high score** | Run scoring, medals/rank where implemented, **localStorage** persistence — **no** server backend. |
| **HUD / minimap** | Compact terminal-style HUD, objective line, combat strip, **M** minimap (see in-game help). |
| **World progression** | Episode 1 catalog → boss → optional **World 2** / **World 3** continuation when unlock flow allows (banners and atmosphere differ per arc). |
| **Quality gate** | `npm test`, `npm run lint`, `npm run build` expected green in CI and before releases. |

**Arena (2D):** local sandbox — useful for tests and quick PvP/PvE; not where feature depth is concentrated.
