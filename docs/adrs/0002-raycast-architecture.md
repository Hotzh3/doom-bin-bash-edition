# ADR 0002: Raycast architecture

## Title
Raycast-first architecture as the product runtime core

## Status
Accepted

## Context
El estado actual del proyecto posiciona `RaycastScene` como experiencia principal jugable en navegador, con módulos especializados en `src/game/raycast/` y escenas de soporte (`MenuScene`, `PrologueScene`, `RaycastWorldLockedScene`). `ArenaScene` se conserva como sandbox 2D y cobertura de regresión, no como flujo principal.

Referencias canónicas:
- [../architecture.md](../architecture.md)
- [../roadmap-next-block.md](../roadmap-next-block.md)
- [../phases/phase-21-runtime-budget.md](../phases/phase-21-runtime-budget.md)

## Problem
Se necesita formalizar por qué el proyecto usa una arquitectura raycast propia sobre Phaser 3, en vez de migrar a un motor 3D completo o mantener múltiples núcleos de gameplay con igual prioridad.

## Constraints
- Vertical slice de portfolio: prioriza una experiencia compacta, demostrable y estable.
- Runtime browser-first: CPU/GPU budget y bundle size acotados.
- Código existente con cobertura en Vitest para lógica crítica.
- No backend obligatorio para loop core.
- Evitar refactors de alto riesgo sobre `RaycastScene` mientras se mantiene evolución incremental.

## Decision
Mantener una arquitectura **raycast-first** con estas reglas:
- `RaycastScene` es el runtime principal del producto.
- Lógica reusable/pura se extrae a módulos de `src/game/raycast/` y `src/game/systems/` cuando reduzca acoplamiento sin romper flujo.
- `ArenaScene` permanece como modo secundario y superficie de regresión; no dirige decisiones de producto.
- Cualquier cambio estructural profundo se ejecuta en pasos pequeños con pruebas de regresión.

## Tradeoffs
- Ventaja: control visual y de performance del pipeline raycast, con iteración rápida.
- Ventaja: mayor determinismo y testabilidad que una migración 3D apresurada.
- Costo: `RaycastScene` sigue siendo un punto de alta responsabilidad técnica.
- Costo: limitar el scope 3D reduce acceso inmediato a tooling de motores 3D modernos.

## Alternatives considered
- Migrar a motor 3D completo ahora: descartado por riesgo de reescritura y pérdida de foco del slice.
- Híbrido raycast + 3D engine para escenas principales: descartado por complejidad operativa y debugging.
- Volver a arena-first (2D): descartado por desalineación con el pitch actual del portfolio.

## Consequences
- Maintainability: mejora al documentar ownership claro del núcleo raycast y fronteras de extracción.
- Deterministic gameplay: se preserva al mantener reglas authored y módulos de lógica testeable.
- Browser constraints: se favorece pipeline controlado y optimizable sobre hot paths conocidos.
- Testing: se mantiene la estrategia de pruebas unitarias en sistemas y módulos puros.

## Future evolution
- Extraer submódulos de `RaycastScene` por responsabilidad (sin big-bang rewrite).
- Introducir budgets explícitos de frame-time por subsistema en docs de performance.
- Mantener `ArenaScene` como compatibilidad de pruebas hasta decidir su retiro o aislamiento completo.

## Cross-links
- [0003-encounter-director.md](./0003-encounter-director.md)
- [0004-world-separation-strategy.md](./0004-world-separation-strategy.md)
- [0007-docker-runtime-strategy.md](./0007-docker-runtime-strategy.md)
