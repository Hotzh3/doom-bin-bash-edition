# ADR 0006: Multiplayer strategy (future-oriented)

## Title
Deferred multiplayer with offline-first contracts and authority boundaries

## Status
Proposed

## Context
El estado actual del repositorio es un vertical slice principalmente single-player raycast con foco en estabilidad de gameplay, documentación y test coverage. No existe backend de sesión, replicación ni authority server implementado para el loop raycast.

Referencias canónicas:
- [../architecture.md](../architecture.md)
- [../infra.md](../infra.md)
- [../roadmap-next-block.md](../roadmap-next-block.md)
- [../adr/0009-multiplayer-online-pospuesto-fase-futura.md](../adr/0009-multiplayer-online-pospuesto-fase-futura.md)

## Problem
Se requiere una postura arquitectónica clara para evolución multijugador sin comprometer el estado actual ni prometer features no existentes.

## Constraints
- No backend productivo actualmente.
- Scope de portfolio: prioriza calidad del núcleo local.
- Browser networking con latencia variable y recursos limitados.
- Código existente orientado a loop local determinista/semi-determinista.

## Decision
Adoptar estrategia de multiplayer **pospuesto y contract-first**:
- No implementar online core en la fase actual.
- Diseñar desde ahora fronteras limpias entre estado simulado, input del jugador y eventos de combate/director.
- Favorecer módulos puros y serializables para facilitar eventual replicación.
- Definir futuro modelo autoritativo explícito antes de escribir transporte de red.

## Tradeoffs
- Ventaja: protege estabilidad del vertical slice y evita deuda de red prematura.
- Ventaja: prepara terreno para escalar sin reescritura total.
- Costo: no hay valor inmediato de multiplayer demostrable hoy.
- Costo: ciertas decisiones se aplazan hasta validar arquitectura de backend.

## Alternatives considered
- Implementar online rápido P2P sin autoridad: descartado por riesgo de cheating, desync y debugging complejo.
- Implementar servidor dedicado completo ahora: descartado por sobrealcance respecto al objetivo actual.
- Ignorar por completo consideraciones futuras de red: descartado por costo de migración posterior.

## Consequences
- Maintainability: reduce acoplamiento futuro si se respetan contratos de estado/eventos.
- Deterministic gameplay: base local robusta para comparar simulación y detectar divergencias.
- Browser constraints: no introduce dependencia de red en el core actual.
- Testing: permite mantener pruebas offline hoy y preparar tests de serialización/replay mañana.

## Future evolution
- Definir modelo de autoridad (server authoritative recomendado) y sincronización por snapshot + input reconciliation.
- Añadir capa de eventos de red sobre contratos existentes, no sobre objetos Phaser.
- Introducir telemetría de desync y replay determinista para pruebas multi-cliente.

## Cross-links
- [0002-raycast-architecture.md](./0002-raycast-architecture.md)
- [0003-encounter-director.md](./0003-encounter-director.md)
- [0007-docker-runtime-strategy.md](./0007-docker-runtime-strategy.md)
