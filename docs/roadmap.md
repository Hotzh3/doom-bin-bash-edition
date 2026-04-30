# Roadmap de 4 semanas (equipo de 3)

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
