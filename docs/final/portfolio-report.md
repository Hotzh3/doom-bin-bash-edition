# doom-bin-bash-edition

**Portfolio Technical Report**
Browser FPS · Phaser 3 · TypeScript · Vite
Version: `0.1.0`
Status: `portfolio-ready`, static browser runtime, no backend required

---

## Executive Summary

`doom-bin-bash-edition` is an original browser-playable retro-horror FPS vertical slice built to demonstrate gameplay engineering, authored level design, and disciplined delivery.

The project is intentionally scoped as a client-side experience. It runs in the browser, ships as static assets, and uses local persistence for scores, telemetry, and replayability. The goal is not to simulate a live-service platform or a cloud-backed game. The goal is to show that a compact, technically coherent FPS can be built, tested, and delivered with production-minded structure.

What the project demonstrates:

- A raycast-first FPS runtime with authored encounters and boss structure.
- Deterministic gameplay and local-only state.
- Strong testing coverage around pure combat, scoring, director, and level logic.
- A clean runtime strategy for local development, Docker, GitHub Pages, and GitHub Releases.
- A documented design system for scoring, replayability, World 2 identity, setpieces, and encounter pacing.

The result is a portfolio piece that reads as an engineered product, not a tech demo glued together from placeholder systems.

---

## Project Vision

The project is built around a simple but defensible vision:

**Deliver a browser FPS slice that feels authored, readable, and replayable, while staying small enough to understand and maintain.**

The design goals are:

- Preserve the immediacy of retro FPS input and pacing.
- Keep the runtime browser-native and easy to verify.
- Make score, rank, and run summary matter without adding economy or meta-progression.
- Give World 2 its own identity instead of re-skinning World 1.
- Support demos, recruiter review, and portfolio capture with minimal friction.

This is why the project prioritizes:

- static hosting over backend infrastructure
- deterministic local systems over networked gameplay
- authored setpieces over procedural scale
- readable combat over content bloat

---

## Technical Architecture

### Stack

| Layer          | Choice                                          | Why it fits                                                |
| -------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Runtime        | Phaser 3                                        | Lightweight browser game runtime with direct scene control |
| Language       | TypeScript                                      | Clear contracts for game data, systems, and tests          |
| Build          | Vite                                            | Fast iteration, static build output, easy deploy target    |
| Testing        | Vitest                                          | Fast unit testing for pure gameplay logic                  |
| Delivery       | GitHub Actions + GitHub Pages + GitHub Releases | Simple, auditable portfolio delivery                       |
| Local delivery | Docker Compose                                  | Reproducible dev/runtime path without cloud complexity     |

### Runtime shape

The current architecture is raycast-first:

- `MenuScene` starts the experience and exposes difficulty / challenge selection.
- `PrologueScene` provides a short narrative handoff into play.
- `RaycastScene` owns the main FPS loop.
- `GameDirector` controls pacing and pressure.
- `RaycastLevel` and `RaycastWorldTwoLevels` define authored data.
- `RaycastRunSummary` and `RaycastScore` own outcome reporting.

### Build/runtime separation

The project treats build and runtime as separate concerns.

- Build time compiles TypeScript and emits static assets into `dist/`.
- Runtime is the browser executing the compiled bundle.
- A `runtime-manifest.json` is written during build to keep each artifact traceable.

This separation is important for portfolio work because it makes the delivery story concrete:

- what was built
- when it was built
- which commit built it
- how it should be hosted

### Module boundaries

| Domain           | Primary files                                                  | Notes                                   |
| ---------------- | -------------------------------------------------------------- | --------------------------------------- |
| Gameplay loop    | `src/game/scenes/RaycastScene.ts`                              | Main play runtime                       |
| Level data       | `src/game/raycast/RaycastLevel.ts`, `RaycastWorldTwoLevels.ts` | Authored maps and sector structure      |
| Rendering        | `src/game/raycast/RaycastRenderer.ts`, `RaycastVisualTheme.ts` | Column renderer and visual grammar      |
| Combat           | `src/game/raycast/RaycastCombatSystem.ts`                      | Hitscan, target info, interaction rules |
| AI / pacing      | `src/game/systems/GameDirector.ts`                             | Pressure, recovery, escalation windows  |
| Scoring          | `src/game/raycast/RaycastScore.ts`, `RaycastRunSummary.ts`     | Score, rank, medals, run summary        |
| Telemetry        | `src/game/raycast/RaycastTelemetry.ts`                         | Local playtest capture only             |
| Runtime metadata | `src/game/runtime/RaycastRuntimeInfo.ts`                       | Build/channel/footer information        |

---

## Gameplay Systems

The gameplay loop is deliberately compact:

- move
- read space
- engage enemies
- collect keys / secrets / tokens
- complete sector goals
- review score and rank

### Core systems

| System         | Role                        | Design note                                    |
| -------------- | --------------------------- | ---------------------------------------------- |
| Movement       | Fast browser FPS motion     | Immediate control response is a priority       |
| Weapon model   | Simple, readable loadout    | Low friction, clear tradeoffs                  |
| Doors and keys | Spatial gating              | Keeps authored routes legible                  |
| Secrets        | Optional score/replay layer | Rewards observation without gating progression |
| HUD            | Minimal tactical overlay    | Preserve readability under pressure            |
| Run summary    | End-of-run breakdown        | Gives score meaning beyond a single number     |

### Scoring and replayability

Scoring is not used as an economy. It is used as a skill expression layer.

Current design supports:

- score
- rank thresholds
- medals
- par time
- challenge modifiers
- local high score persistence
- run summary breakdowns

This keeps replayability centered on self-improvement:

- faster clears
- cleaner combat
- better accuracy
- fewer mistakes
- stronger rank performance

---

## AI / Director Systems

The project does not use generative AI in gameplay runtime. The “AI” layer here is the combat director and authored enemy behavior.

### What the director does

`GameDirector` shapes pacing across a level:

- exploration
- build-up
- ambush
- high intensity
- recovery

This is a practical way to create tension without requiring heavyweight enemy scripting or a server-driven encounter system.

### Why this matters

For a browser FPS, pacing matters as much as raw content count. The director gives the game:

- tempo control
- pressure variation
- authored rhythm
- testable decision logic

It also keeps the runtime deterministic, which is valuable for testing and demo consistency.

### Tradeoff

The tradeoff is that the project gains less systemic variety than a procedural or networked game might offer. That is acceptable here because the goal is a tight vertical slice, not infinite replay.

---

## Testing Strategy

Testing is used to protect the parts of the game that can be expressed as logic, not canvas state.

### What is tested

| Area         | Coverage style | Why it matters                                          |
| ------------ | -------------- | ------------------------------------------------------- |
| Scoring      | Unit tests     | Prevents regressions in rank and medal math             |
| Combat       | Unit tests     | Protects readable hitscan and target logic              |
| Director     | Unit tests     | Keeps pacing decisions stable                           |
| Level data   | Unit tests     | Verifies authored routes, setpieces, and boss structure |
| Presentation | Unit tests     | Protects HUD and run summary output                     |
| Telemetry    | Unit tests     | Keeps local-only capture predictable                    |

### What is not tested here

- Full end-to-end browser automation for every play path.
- Multiplayer/network scenarios, because the project does not ship a backend.
- Deep visual regression coverage, because the art direction is intentionally lightweight and browser performance matters more.

### Why this is the right test shape

The repo is stronger when it tests pure systems and authored data. That gives high confidence without turning the project into a test harness for browser rendering.

---

## Runtime / Deployment

The runtime model is intentionally simple:

- local development with Vite dev server
- local reproducible container runtime with Docker
- production build as static assets
- preview deploy on GitHub Pages
- release artifacts on GitHub Releases

### Runtime contract

| Concern       | Decision                              |
| ------------- | ------------------------------------- |
| Backend       | None required                         |
| Hosting       | Static hosting only                   |
| State         | Local persistence only                |
| Base path     | Configured at build time              |
| Observability | Minimal menu footer + local telemetry |

### Environment strategy

The project uses a small env contract:

- `BASE_PATH`
- `VITE_APP_VERSION`
- `VITE_APP_BUILD_SHA`
- `VITE_APP_BUILD_DATE`
- `VITE_APP_RUNTIME_CHANNEL`
- `VITE_APP_TELEMETRY`

This is enough to make builds traceable without introducing a large configuration surface.

### Artifact structure

```text
dist/
  index.html
  assets/
  runtime-manifest.json
```

That structure is appropriate for static hosting and easy to reason about during review.

### Browser constraints

The browser imposes real constraints:

- no direct filesystem access for the runtime
- no required local server state
- limited guarantees about background execution
- performance sensitivity on laptops and mobile browsers

The architecture respects those constraints by keeping the runtime static, deterministic, and locally observable.

---

## Engineering Tradeoffs

This project is opinionated about what it does not do.

| Decision                  | Tradeoff                              | Why it was chosen                             |
| ------------------------- | ------------------------------------- | --------------------------------------------- |
| No backend                | No remote persistence or leaderboards | Keeps delivery simple and portable            |
| No procedural mega-system | Less infinite replay                  | Better authored feel and clearer review story |
| No K8s / Terraform        | Less infra complexity                 | Better fit for a portfolio slice              |
| No live service loop      | Less operational scope                | Avoids pretending to be a product it is not   |
| Static hosting            | No server rendering                   | Best match for browser-native gameplay        |

The key engineering principle is restraint. The project looks more mature because it knows where to stop.

---

## World Design Philosophy

World design is guided by authored identity, not scale.

### World 2 goals

World 2 is the “cold ion abyss” layer:

- basalt
- ion shafts
- nadir glow
- sulfur lattice
- ritual-industrial transitions

The goal is not to copy classic DOOM maps. The goal is to create a distinct visual and spatial language that still feels readable under pressure.

### Design rules

- Use setpieces to create memory.
- Use lighting hierarchy to guide attention.
- Use pacing shifts to mark transitions.
- Use silhouettes and reveals to communicate danger.
- Keep boss arenas legible before they become dramatic.

### Boss design

The Bloom Warden is designed to feel authored rather than inflated.

- iconographic arena shape
- strong movement readability
- layered lighting states
- combat pressure without sponge behavior

This makes the fight more memorable and easier to explain in a portfolio review.

---

## Screenshots and GIF Placeholders

Use these as placeholders in the PDF export.

### Core screenshots

| Figure   | Placeholder                                              | Intended content                    |
| -------- | -------------------------------------------------------- | ----------------------------------- |
| Figure 1 | `docs/assets/screenshots/raycast-menu.webp`              | Menu, mode split, first impression  |
| Figure 2 | `docs/assets/screenshots/raycast-prologue.webp`          | Clean-room framing and tone         |
| Figure 3 | `docs/assets/screenshots/raycast-sector-hud.webp`        | Main FPS HUD and combat readability |
| Figure 4 | `docs/assets/screenshots/raycast-exploration.webp`       | Corridor readability and motion     |
| Figure 5 | `docs/assets/screenshots/raycast-combat-director.webp`   | Combat feedback and pacing pressure |
| Figure 6 | `docs/assets/screenshots/raycast-level-clear.webp`       | Score, rank, summary, end-state     |
| Figure 7 | `docs/assets/screenshots/raycast-world2-atmosphere.webp` | World 2 identity and atmosphere     |

### Suggested GIFs

| Asset | Placeholder                                   | Intended content         |
| ----- | --------------------------------------------- | ------------------------ |
| GIF 1 | `docs/assets/gifs/raycast-boot-to-sector.gif` | Menu to combat funnel    |
| GIF 2 | `docs/assets/gifs/raycast-combat-loop.gif`    | Movement, fire, HUD loop |

### Screenshot notes

- Use the established `960×540` capture geometry.
- Keep the browser UI hidden.
- Prefer one strong frame per system, not many redundant frames.
- Make sure the World 2 frames emphasize lighting hierarchy and boss identity.

---

## Roadmap

The current slice is intentionally bounded, but the project has sensible next steps.

| Next step                  | Value                      | Scope risk    |
| -------------------------- | -------------------------- | ------------- |
| World 3 authored expansion | More content variety       | Medium        |
| Optional leaderboard sync  | Social replay layer        | Medium / high |
| Save sync or profile layer | Cross-device continuity    | Medium        |
| More runtime observability | Better build visibility    | Low           |
| Additional setpiece polish | Stronger demo presentation | Low           |

The important principle is that future growth should remain additive. The game should continue to work as a static browser title even if none of the future steps ship.

---

## Lessons Learned

### 1. Small systems age better

The strongest parts of the project are the ones that are clear enough to test:

- score
- director
- level data
- runtime metadata

### 2. Constraints improve readability

Browser-only delivery forced the architecture to stay honest. That constraint helped keep the project focused and portable.

### 3. Authored content needs structure

World design is more convincing when it is supported by explicit grammar, not just visual variation.

### 4. Presentation is part of engineering

A good summary screen, runtime footer, release flow, and screenshot plan are not “extra.” They are what make a project reviewable.

### 5. It is better to explain tradeoffs than to hide them

The repository is stronger because it says what it is:

- a browser FPS vertical slice
- no backend
- no fake production claims
- real tests
- real build and deploy hygiene

That honesty reads well in both engineering and recruiting contexts.

---

## Closing Note

This project is intentionally sized to be understandable, demoable, and defensible.
It is not trying to imitate a commercial live-service shooter. It is trying to show that a
single engineer can build an original browser FPS with clear architecture, good pacing,
solid test discipline, and professional delivery hygiene.

That is the standard this portfolio piece is aiming for.
