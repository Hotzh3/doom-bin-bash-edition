# ADR Index (Portfolio Series)

Esta carpeta contiene ADRs de arquitectura de nivel portfolio para el estado actual del proyecto raycast-first.

## Scope

- Proyecto: `doom-bin-bash-edition`
- Stack: Phaser 3 + TypeScript + Vite + Vitest
- Enfoque: vertical slice browser-playable, sin backend de producción
- Estado: decisiones para arquitectura actual + evolución futura explícita

## Relación con documentos canónicos

- Arquitectura actual: [../architecture.md](../architecture.md)
- Runtime e infraestructura actual: [../infra.md](../infra.md)
- Prioridades siguientes: [../roadmap-next-block.md](../roadmap-next-block.md)
- Historial de fases técnicas: [../phases/phase-21-runtime-budget.md](../phases/phase-21-runtime-budget.md)

## ADRs

1. [0002 — Raycast architecture](./0002-raycast-architecture.md)
2. [0003 — Encounter director architecture](./0003-encounter-director.md)
3. [0004 — World separation strategy](./0004-world-separation-strategy.md)
4. [0005 — Scoring philosophy](./0005-scoring-philosophy.md)
5. [0006 — Multiplayer strategy (future-oriented)](./0006-multiplayer-strategy.md)
6. [0007 — Docker/runtime strategy](./0007-docker-runtime-strategy.md)

## Notas

- Esta serie no reemplaza automáticamente `docs/adr/` (histórico). Ambos pueden coexistir durante la transición documental.
- Las decisiones aquí documentadas no asumen features no implementadas hoy; las extensiones se marcan como evolución futura.
