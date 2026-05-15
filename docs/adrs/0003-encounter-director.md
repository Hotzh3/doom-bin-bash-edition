# ADR 0003: Encounter director architecture

## Title
Rule-based encounter director for deterministic pacing

## Status
Accepted

## Context
El proyecto ya utiliza `GameDirector` y módulos asociados de pacing para alternar estados de calma, presión, emboscada y recuperación, integrados al loop de `RaycastScene` y cubiertos por tests (`game-director`, `director-pacing`, `raycast-*` relacionados).

Referencias canónicas:
- [../architecture.md](../architecture.md)
- [../ai.md](../ai.md)
- [../phases/phase-27-encounter-grammar-level-design.md](../phases/phase-27-encounter-grammar-level-design.md)

## Problem
Sin una decisión explícita, el sistema de encuentros puede fragmentarse entre scripting ad-hoc, aleatoriedad opaca y lógica difícil de validar, degradando fairness y mantenibilidad.

## Constraints
- Necesidad de pacing legible para demo y balance.
- No introducir dependencias de IA generativa en runtime core.
- Respetar authored levels y encounter beats ya existentes.
- Mantener comportamiento depurable y reproducible para pruebas.

## Decision
Consolidar arquitectura de encuentros alrededor de un director **rule-based**:
- `GameDirector` define estado de intensidad y ventanas de spawn/recuperación.
- Niveles authored aportan datos de encounter grammar (triggers, beats, zonas).
- La escena consume decisiones del director y las traduce en acciones concretas de gameplay.
- Ajustes de dificultad y pacing se realizan por configuración y datos, no por lógica dispersa.

## Tradeoffs
- Ventaja: control explícito de dificultad, fairness y ritmo narrativo.
- Ventaja: testabilidad de funciones/políticas de pacing.
- Costo: tuning manual continuo de parámetros.
- Costo: menos variabilidad emergente que enfoques procedural-heavy o ML-driven.

## Alternatives considered
- Runtime AI generativa para encounters: descartada por latencia, costo, no determinismo y complejidad operacional.
- Scripting lineal por sector sin director central: descartado por duplicación y baja escalabilidad.
- Random puro con tablas simples: descartado por resultados poco legibles y menos justos.

## Consequences
- Maintainability: reglas centralizadas y configuración versionable.
- Deterministic gameplay: se facilita reproducir runs para debugging y comparación de cambios.
- Browser constraints: evita llamadas remotas y dependencia de red para decisiones críticas.
- Testing: habilita suites robustas sobre director y pacing.

## Future evolution
- Añadir perfiles de director por mundo/dificultad con contratos de datos explícitos.
- Instrumentar métricas de pacing por segmento para balance iterativo offline.
- Definir invariantes de fairness (telegraph windows, spawn caps) como tests de contrato.

## Cross-links
- [0002-raycast-architecture.md](./0002-raycast-architecture.md)
- [0004-world-separation-strategy.md](./0004-world-separation-strategy.md)
- [0005-scoring-philosophy.md](./0005-scoring-philosophy.md)
