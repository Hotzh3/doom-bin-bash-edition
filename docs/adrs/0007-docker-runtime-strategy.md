# ADR 0007: Docker/runtime strategy

## Title
Dual runtime strategy: native-first development, Docker for reproducibility and delivery hygiene

## Status
Accepted

## Context
El proyecto ya puede ejecutarse de forma nativa con Vite y pruebas locales, y también incluye `Dockerfile` + `docker-compose.yml` como base de reproducibilidad. La infraestructura actual no representa producción cloud completa.

Referencias canónicas:
- [../infra.md](../infra.md)
- [../architecture.md](../architecture.md)
- [../roadmap-next-block.md](../roadmap-next-block.md)
- [../phases/phase-21-runtime-budget.md](../phases/phase-21-runtime-budget.md)

## Problem
Hace falta dejar explícito cómo conviven runtime local para iteración rápida y contenedores para consistencia de entorno, evitando expectativas incorrectas de “infra productiva cerrada”.

## Constraints
- Proyecto browser-game con ciclo de iteración corto.
- Equipo/scope de portfolio: prioriza velocidad de desarrollo y evidencia técnica suficiente.
- Sin backend crítico en producción dentro del alcance actual.
- CI ya valida test/lint/build.

## Decision
Establecer estrategia runtime dual:
- **Native-first** para desarrollo diario (`npm run dev`, `npm run test`, `npm run build`).
- **Docker as reproducibility layer** para demos técnicas, handoff y consistencia de entorno.
- Mantener documentadas limitaciones actuales de runtime/infra para no sobredeclarar readiness productivo.

## Tradeoffs
- Ventaja: productividad alta local + entorno reproducible cuando se necesita.
- Ventaja: postura honesta y profesional sobre madurez de infraestructura.
- Costo: mantener dos caminos operativos requiere disciplina documental.
- Costo: Docker actual no reemplaza una estrategia completa de observabilidad, rollout o escalado.

## Alternatives considered
- Solo Docker para todo el desarrollo: descartado por fricción en iteración de gameplay.
- Solo runtime local sin contenedores: descartado por menor reproducibilidad de entrega.
- Diseñar infraestructura cloud completa ya: descartado por sobrealcance para este stage.

## Consequences
- Maintainability: reduce “works on my machine” y mejora onboarding.
- Deterministic gameplay: entorno más estable para reproducir bugs/perf.
- Browser constraints: se preserva enfoque en optimización del cliente, no en sobreinfra.
- Testing: CI/local siguen alineados con el pipeline principal del repositorio.

## Future evolution
- Endurecer `Dockerfile` multi-stage para artefacto estático más pequeño.
- Añadir perfil de compose para smoke E2E de documentación/demo.
- Evaluar hosting estático + backend opcional de telemetría cuando el roadmap lo justifique.

## Cross-links
- [0002-raycast-architecture.md](./0002-raycast-architecture.md)
- [0006-multiplayer-strategy.md](./0006-multiplayer-strategy.md)
- [../infra.md](../infra.md)
