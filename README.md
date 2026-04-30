# doom-bib-bash-edition

Demo universitaria de arena shooter 2D "Doom-inspired" para **2 jugadores locales** con **IA de enemigos**, oleadas y power-ups.

## Objetivo del MVP
- 2 jugadores en teclado compartido.
- PvP + PvE simultáneo.
- Oleadas escalables.
- IA con FSM (SPAWN, CHASE, ATTACK, DEAD).
- Scoreboard y fin de ronda.

## Stack recomendado (realista para 4 semanas)
- **Frontend juego:** Phaser 3 + TypeScript + Vite
- **Backend opcional para stats:** Node.js + Express + TypeScript
- **Persistencia MVP:** SQLite (archivo local)
- **Calidad:** ESLint + Prettier + Vitest
- **DevOps:** Docker + Docker Compose + GitHub Actions

## Arquitectura propuesta
Revisar: `docs/architecture.md`

## Roadmap 4 semanas
Revisar: `docs/roadmap.md`

## Estructura del proyecto (inicio)
```
.
├─ game/                     # Cliente Phaser
│  └─ src/
│     ├─ scenes/
│     ├─ entities/
│     ├─ systems/
│     ├─ ai/
│     ├─ ui/
│     ├─ utils/
│     └─ config/
├─ server/                   # API opcional para estadísticas
│  └─ src/
├─ docs/
│  ├─ adr/
│  ├─ architecture.md
│  └─ roadmap.md
├─ tests/
└─ .github/workflows/
```

## Primer set de archivos recomendado
1. `README.md` (visión, setup, controles, demo).
2. `docs/architecture.md` (módulos, flujo, eventos).
3. `docs/roadmap.md` (sprints + definición de terminado).
4. `docs/adr/0001-stack-mvp.md`.
5. `.editorconfig`, `.gitignore`, `docker-compose.yml`.
6. `game/package.json`, `game/vite.config.ts`, `game/tsconfig.json`.
7. `server/package.json` (si guardan stats desde día 1).
8. `.github/workflows/ci.yml`.

## Controles MVP sugeridos
- P1: `WASD` + `F` disparo
- P2: `← ↑ ↓ →` + `L` disparo

## Siguiente paso inmediato
Construir el vertical slice:
1) escena arena,
2) movimiento/disparo de ambos jugadores,
3) 1 tipo de enemigo con FSM mínima,
4) colisiones y daño,
5) HUD con vida y kills.
