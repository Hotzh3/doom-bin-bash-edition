# doom-hell-arena-ai

Demo universitaria de arena shooter 2D **Doom-inspired** para 2 jugadores locales, con PvP + PvE, IA básica demostrable y enfoque en entrega de MVP en 4 semanas.

## Objetivo del proyecto
Entregar una demo jugable y profesionalmente organizada, con documentación, CI/CD, testing y flujo colaborativo por ramas.

## Stack técnico
- **Juego:** Phaser 3 + TypeScript + Vite
- **Backend (fase avanzada/opcional):** Node.js + Express + SQLite
- **Calidad:** ESLint + Prettier + Vitest
- **DevOps:** Docker + Docker Compose + GitHub Actions

## Flujo de trabajo en ramas (propuesto)
- `main`: rama estable (solo merges de PR aprobados).
- `develop`: integración de features terminadas.
- `feature/*`: trabajo por tarea específica.
- `fix/*`: correcciones puntuales.
- `docs/*`: documentación/ADRs/README.

### Convención de PRs
- PR pequeño, claro y enfocado en una sola fase/tarea.
- Debe incluir: resumen, evidencia de pruebas, riesgos y siguientes pasos.

---

## Proyecto dividido por fases

## Fase 0 — Setup base del repositorio
**Meta:** dejar el proyecto listo para colaborar sin fricción.

### Entregables
- Estructura inicial de carpetas.
- README base + docs de arquitectura/roadmap/ADR.
- `.editorconfig`, `.gitignore`, `docker-compose.yml`.

### Necesitamos para cumplirla
- Definir ramas (`main`, `develop`).
- Configurar protección de rama en GitHub (recomendado).
- Asegurar que todos clonan y pueden correr comandos base.

---

## Fase 1 — Vertical Slice jugable (núcleo)
**Meta:** primer build jugable con loop básico de combate.

### Entregables
- `MenuScene` + `ArenaScene`.
- Player 1 (WASD + disparo) y Player 2 (flechas + disparo).
- Proyectiles, colisiones, daño y muerte.
- 1 tipo de enemigo con FSM mínima (SPAWN, CHASE, ATTACK, DEAD).
- HUD básico: vida y kills.

### Necesitamos para cumplirla
- Input manager para 2 jugadores.
- Sistema de física/colisiones estable.
- Assets temporales (placeholders) para avanzar rápido.
- Pruebas unitarias mínimas de lógica crítica (daño/FSM).

---

## Fase 2 — Gameplay completo MVP
**Meta:** cumplir requisitos centrales del curso en gameplay.

### Entregables
- Oleadas progresivas.
- Power-ups: vida, velocidad y daño/doble disparo.
- Respawn de jugadores.
- Scoreboard por ronda y condición de victoria.
- Pantalla de fin de partida.

### Necesitamos para cumplirla
- `WaveSystem` configurable por dificultad.
- `PowerUpSystem` con spawn controlado.
- `ScoreSystem` + eventos de juego desacoplados.
- Sesión de balance (vida/daño/frecuencia de spawn).

---

## Fase 3 — IA y dificultad adaptativa
**Meta:** demostrar componente de IA más allá de enemigos básicos.

### Entregables
- FSM formal de enemigos (con transiciones claras).
- `TargetSelector` (distancia y/o vida).
- `AIDirector` básico (sube o baja presión según rendimiento).

### Necesitamos para cumplirla
- Métricas simples en runtime (tiempo de supervivencia, kills/min, daño recibido).
- Reglas explícitas del director (thresholds y acciones).
- Tests unitarios de IA (transiciones y selección de objetivo).

---

## Fase 4 — Ingeniería y entrega académica
**Meta:** tener proyecto presentable, reproducible y evaluable.

### Entregables
- CI con lint + tests.
- Coverage report.
- Dockerfile(s) y Docker Compose funcional.
- ADRs y documentación final de arquitectura/eventos.
- Guion de demo de 15 minutos.

### Necesitamos para cumplirla
- Workflow de GitHub Actions estable.
- Comandos únicos de arranque en README.
- Checklist de release (bugs críticos, performance mínima, UX básica).

---

## Fase 5 — Extras (solo si MVP está sólido)
**Meta:** agregar valor sin arriesgar entrega.

### Entregables posibles
- Boss por rondas.
- Nuevos tipos de enemigos.
- Eventos aleatorios.
- Backend de historial de partidas.

### Necesitamos para cumplirla
- Confirmar CI verde y bugs críticos en cero.
- Timebox estricto por feature (si no entra, se descarta).

---

## Roadmap resumido (4 semanas)
- **Semana 1:** Fase 1
- **Semana 2:** Fase 2
- **Semana 3:** Fase 3
- **Semana 4:** Fase 4
- **Extras:** solo si sobra tiempo (Fase 5)

## Próximo paso inmediato
Implementar Fase 1 en rama `feature/phase-1-vertical-slice`:
1. bootstrap de Phaser + TypeScript + Vite,
2. `MenuScene` y `ArenaScene`,
3. controles de 2 jugadores,
4. disparo y colisiones.
