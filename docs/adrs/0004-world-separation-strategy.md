# ADR 0004: World separation strategy

## Title
Data-driven world separation by segment with shared runtime

## Status
Accepted

## Context
El juego ya separa contenido por segmentos (`world1`, `world2`, `world3`) mediante catálogos y configuración de nivel, manteniendo un runtime compartido en `RaycastScene` y módulos comunes de render/gameplay. World 2 y World 3 extienden identidad sin duplicar motor.

Referencias canónicas:
- [../architecture.md](../architecture.md)
- [../roadmap-next-block.md](../roadmap-next-block.md)
- [../phases/phase-31-world-2-final-identity.md](../phases/phase-31-world-2-final-identity.md)
- [../phases/phase-34-next-authored-expansion.md](../phases/phase-34-next-authored-expansion.md)

## Problem
Escalar contenido por mundos puede derivar en forks de escena/sistemas, duplicación de lógica y regresiones cruzadas si no se define una estrategia de separación clara.

## Constraints
- Mantener performance browser y complejidad controlada.
- Evitar duplicar `RaycastScene` por mundo.
- Mantener coherencia de UI/HUD/progresión entre segmentos.
- Preservar testabilidad de catálogo, episodio y atmósfera.

## Decision
Adoptar separación por mundo **data-first** con runtime común:
- Cada mundo define identidad en datos/config (niveles, atmósfera, copy, pacing, score hooks).
- `RaycastScene` y sistemas base permanecen compartidos.
- Las variaciones visuales/comportamentales se inyectan por `worldSegment` y catálogos.
- Nuevos mundos siguen el mismo contrato antes de introducir sistemas exclusivos.

## Tradeoffs
- Ventaja: alta maintainability al evitar forks de arquitectura por contenido.
- Ventaja: crecimiento incremental de contenido con menor riesgo técnico.
- Costo: algunas reglas condicionales por segmento incrementan complejidad local.
- Costo: límites de diferenciación si se evita añadir mecánicas exclusivas.

## Alternatives considered
- Escena dedicada por mundo: descartado por duplicación, mantenimiento alto y riesgo de divergencia.
- Sistema plugin por mundo desde ahora: descartado por sobreingeniería para el alcance actual.
- Un solo mundo sin segmentación: descartado por menor variedad y valor de portfolio.

## Consequences
- Maintainability: favorece contratos de datos y evolución predecible.
- Deterministic gameplay: niveles authored por segmento preservan comportamiento controlado.
- Browser constraints: runtime común reduce costo de inicialización y complejidad de bundle.
- Testing: pruebas por catálogo/segmento detectan regresiones sin multiplicar infra.

## Future evolution
- Formalizar schema tipado para “world packs” (niveles, reglas, presentation tokens).
- Evaluar carga lazy de packs de mundo según métricas reales de bundle/latencia.
- Definir criterios para cuándo un mundo justifica subsistema propio en lugar de configuración.

## Cross-links
- [0002-raycast-architecture.md](./0002-raycast-architecture.md)
- [0003-encounter-director.md](./0003-encounter-director.md)
- [0005-scoring-philosophy.md](./0005-scoring-philosophy.md)
