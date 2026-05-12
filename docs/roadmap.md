# Roadmap histórico (4 semanas, equipo de 3)

> **Nota (2026):** Este archivo conserva el **plan académico original** del MVP arena 2D (oleadas, backend opcional). **No** es la lista de features implementadas: para eso usa el README del repo (**“Implemented today”** vs **roadmap**) y **`docs/architecture.md`**. El producto actual está **centrado en `RaycastScene`**; para presupuesto técnico y fases recientes, ver **`docs/phases/phase-21-runtime-budget.md`**, **`docs/roadmap-next-block.md`** y el índice en **`docs/README.md`**.

## Estado del producto (actual)

El juego entregado es un **vertical slice** jugable de punta a punta: **Episode 1** (cinco sectores + boss), **World 2** y **World 3** opcionales según progresión, HUD/minimap, score y resumen de run, tests y CI. Este roadmap histórico no describe ese alcance en detalle.

Notas de ingeniería y pulido recientes: **`docs/README.md`** (índice), incluyendo fases **21–25** (runtime, identidad W2, encuentros/boss, scoring, release readiness).

---

## Semana 1 — Fundaciones + vertical slice
- Setup repo, lint/test/CI, Docker básico.
- ArenaScene + 2 jugadores + disparo.
- 1 enemigo con FSM (CHASE/ATTACK).
- Colisiones, daño, muerte básica.
- HUD mínimo (vida + kills).

## Semana 2 — Gameplay núcleo
- Oleadas progresivas.
- Power-ups (vida, velocidad, daño/doble tiro).
- Respawn y scoreboard de ronda.
- Balance inicial y pulido de controles.

## Semana 3 — IA Director + robustez
- AIDirector (ajuste dinámico).
- Target selection (distancia/vida).
- Tests unitarios de FSM/sistemas críticos.
- QA, bugfixing, métricas simples.

## Semana 4 — Cierre académico
- Documentación final + ADRs.
- Demo script 15 min + video backup.
- Hardening: performance, UX, errores.
- Opcional: backend stats local + endpoint top matches.

## Definición de terminado (MVP)
- Se puede jugar una ronda completa con 2 jugadores.
- Enemigos aparecen por oleadas y atacan.
- Hay ganador y pantalla final.
- CI verde con lint + tests.
