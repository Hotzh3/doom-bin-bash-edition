# ADR 0005: Scoring philosophy

## Title
Skill-readable local scoring for replayability in a no-backend slice

## Status
Accepted

## Context
El proyecto ya implementa score por run/sector, rank y high score local, con resumen al cierre y evolución en fases de replayability. No existe backend de leaderboard ni meta-progresión online en alcance actual.

Referencias canónicas:
- [../architecture.md](../architecture.md)
- [../phases/phase-24-replayability-scoring.md](../phases/phase-24-replayability-scoring.md)
- [../phases/phase-26-scoring-replayability-2.0.md](../phases/phase-26-scoring-replayability-2.0.md)
- [../roadmap-next-block.md](../roadmap-next-block.md)

## Problem
Sin principios explícitos, el score puede volverse opaco, difícil de balancear y poco útil para rejugabilidad, especialmente en un proyecto sin backend competitivo.

## Constraints
- Vertical slice single-player, browser-first.
- Persistencia local (`localStorage`) sin servicio remoto.
- Necesidad de feedback rápido y entendible en HUD/summary.
- Evitar fórmulas excesivamente complejas o no testeables.

## Decision
Adoptar filosofía de score **legible por skill** y compatible con entorno local:
- El score recompensa ejecución (combate, supervivencia, objetivos/secretos, clears).
- El jugador debe entender por qué sube/baja su resultado desde el summary.
- High score/rank se mantienen locales y versionables.
- No se simula “economía live-service” ni leaderboard online en esta fase.

## Tradeoffs
- Ventaja: claridad para playtesting, balance y comunicación de progreso personal.
- Ventaja: pruebas unitarias deterministas sobre funciones de scoring/rank.
- Costo: menor motivación social comparado con ranking global online.
- Costo: riesgo de sobreoptimizar para rutas conocidas si no se ajusta contenido.

## Alternatives considered
- Score minimalista solo por kills: descartado por baja expresividad de skill.
- Score opaco multi-factor sin visibilidad en UI: descartado por mala UX y debugging difícil.
- Leaderboard online inmediato: descartado por falta de backend y riesgo de desviar alcance.

## Consequences
- Maintainability: reglas de score explícitas y acotadas por módulo.
- Deterministic gameplay: facilita comparar runs bajo mismas condiciones.
- Browser constraints: evita dependencias de red para loop de recompensa.
- Testing: cobertura directa en `raycast-score` y `raycast-run-summary`.

## Future evolution
- Export/import de snapshots de score para análisis offline.
- Segmentación de high score por dificultad/mundo con migración de claves.
- Preparar contratos de evento para eventual sincronización remota sin romper modo offline.

## Cross-links
- [0003-encounter-director.md](./0003-encounter-director.md)
- [0004-world-separation-strategy.md](./0004-world-separation-strategy.md)
- [0006-multiplayer-strategy.md](./0006-multiplayer-strategy.md)
