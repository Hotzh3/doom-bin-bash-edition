# Fase 21 — Runtime Slimdown & Technical Budgeting

Documento de planificación y cierre para reducir deuda estructural **sin cambiar gameplay visible**. Las reglas de la fase: sin features nuevas, sin balance/mapas/boss/World 2 distinto al comportamiento actual, sin reescritura del renderer, mantener `ArenaScene` y CI local (lint / tests / build).

---

## Auditoría estructural (baseline) — 2026-05-10

Métricas aproximadas de líneas (incl. comentarios, sujetas a cambio al editar archivos):

| Archivo | Líneas | Rol principal | Notas Fase 21 |
|---------|--------|---------------|----------------|
| `RaycastScene.ts` | ~2214 | Orquestación Phaser: input, combate, director, HUD, minimap, pausa, overlays, transiciones | **Principal deuda**; cualquier extracción debe ser por **trozos pequeños** (helpers o submódulos) con tests de regresión. |
| `RaycastLevel.ts` | ~1701 | Tipos de nivel, catálogo Ep1+boss, funciones de consulta de mapa/nivel | Ya aligerado: datos World 2 en módulo aparte (ver abajo). Resto: muchas **funciones puras** candidatas a archivo `RaycastLevelQuery.ts` o similar **sin tocar datos**. |
| `RaycastRenderer.ts` | ~1301 | Columnas, billboards, atmósfera columnar | **No reescribir**; solo optimizaciones puntuales si perfil lo justifica. |
| `RaycastMinimap.ts` | ~131 | Dibujo 2D derivado | Bajo riesgo de “archivo grande”; el coste sería **CPU por frame** en escena, no LOC. |
| `RaycastWorldTwoLevels.ts` | ~472 | Solo datos de los 2 sectores W2 + catálogo | **Hecho** — extraído desde `RaycastLevel` para recortar LOC y acoplamiento. |

**Flujo de escenas (sin cambio requerido en A1):** `MenuScene` → `PrologueScene` → `RaycastScene` / `RaycastWorldLockedScene` / `ArenaScene` — revisar solo si un refactor de escena toca `scene.start` o datos pasados.

**Bundle:** Vite emite aviso de chunk &gt; 500 kB (gzip ~400 kB en build reciente). Mitigar con `manualChunks` o code-splitting es **otra tarea**; no mezclar con slimdown de módulos sin medición.

**Riesgo de ciclos:** Cualquier nuevo módulo que importe `RaycastLevel` en runtime y sea importado *por* `RaycastLevel` exige `import type` o extracción solo de datos/funciones puras hacia un tercer archivo.

---

## Subfases numeradas (plan maestro Fase 21)

| ID | Nombre | Objetivo | Archivos típicos | Responsabilidades a mover / tratar | Riesgos | Tests | Validación manual | “Commits” sugeridos (grupos lógicos) |
|----|--------|----------|------------------|-----------------------------------|---------|-------|-------------------|----------------------------------------|
| **21-A1** | **Auditoría + baseline** | Fijar métricas, mapa de deuda y reglas de parada en este doc; **sin cambio de TS** | `docs/phase21-runtime-budget.md` (y referencias) | Ninguna movida; solo transparencia | Bajo | `npm test` + lint + build como sanidad del repo | Ninguna obligatoria | `docs(phase21): add structural audit baseline` |
| **21-B1** | **World 2 datos** (estado) | Nivelar datos W2 en módulo dedicado | `RaycastWorldTwoLevels.ts`, `RaycastLevel.ts` | Constantes de niveles W2 + re-export | Medio (binding `import` vs `export from`) | `raycast-level`, `raycast-episode`, suite | Smoke W2 | `refactor(raycast): extract World 2 level data module` |
| **21-B2** | **Helpers de nivel** (opcional siguiente) | Sacar funciones **puras** de consulta de `RaycastLevel.ts` | Nuevo `RaycastLevelRuntime.ts` o similar, `RaycastLevel.ts` | `getRaycastLevelById`, reachability, clones — solo si no crean ciclo | **Alto** si mezcla tipos y valor con imports circulares | Tests nivel + imports | Clear de un sector | `refactor(raycast): split level query helpers` |
| **21-C1** | **Minimap / render** | Solo si hay evidencia (FPS); p.ej. throttle ya en escena | `RaycastScene.ts`, opc. `RaycastMinimap.ts` | Reducir llamadas redundantes sin cambiar imagen | Alto si toca cada frame sin prueba | `raycast-minimap`, smoke | Comparar FPS feel | `perf(minimap): reduce update frequency` |
| **21-D1** | **Docs alineados** | README, architecture, roadmap sincronizados con raycast-first | `README.md`, `docs/architecture.md`, `docs/roadmap.md` | N/A | Bajo | N/A | Revisar enlaces | `docs: align architecture with current slice` |
| **21-E1** | **Cierre de fase** | `npm run test` + `lint` + `build` verdes; checklist | — | — | Bajo | Completo | Pase menú → raycast → `ESC` | `chore: verify phase 21 quality gates` |

**Estado de implementación (2026-05-10):** **21-A1** **completada** (auditoría + baseline documentados aquí). **21-B1** consta como **ya aplicada** en el repositorio (`RaycastWorldTwoLevels.ts`). **21-B2 en adelante** = pendiente hasta nueva iteración.

---

## 1. Plan operativo breve

| Paso | Acción |
|------|--------|
| **A** | Auditar tamaño y responsabilidades de `RaycastScene`, `RaycastLevel`, `RaycastRenderer`, `RaycastMinimap`, flujo de escenas y docs. |
| **B** | Extraer módulos pequeños con datos o helpers **sin** mover lógica que rompa dependencias circulares en runtime. |
| **C** | Solo optimizar render/minimap si hay ganancia clara y verificación (tests + smoke manual); si no, documentar y posponer. |
| **D** | Alinear `docs/architecture.md`, `docs/roadmap.md` y árbol del README con el estado real (raycast-first). |
| **E** | Verificación final: `npm run lint`, `npm test`, `npm run build`. |

---

## 2. Subfases incrementales

### A — Auditoría y plan de ejecución

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Mapa mental de acoplamientos y archivos “demasiado grandes”. |
| **Archivos** | `RaycastScene.ts`, `RaycastLevel.ts`, `RaycastRenderer.ts`, `RaycastMinimap.ts`, `MenuScene.ts`, `PrologueScene.ts`, `RaycastWorldLockedScene.ts`, `config.ts`, docs. |
| **Riesgo** | Bajo (solo lectura). |
| **Tests** | Ninguno obligatorio. |

### B — Extracciones pequeñas (implementado en esta iteración)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Sacar datos voluminosos de World 2 a un módulo dedicado; `RaycastLevel` importa y re-exporta para compatibilidad con imports existentes `from './RaycastLevel'`. |
| **Archivos** | **Nuevo:** `src/game/raycast/RaycastWorldTwoLevels.ts`. **Modificado:** `src/game/raycast/RaycastLevel.ts` (import + re-export + uso local de `RAYCAST_WORLD_TWO_CATALOG` en `getRaycastLevelById`). |
| **Riesgo** | Medio-bajo. **Trampa evitada:** `export { X } from './other'` no crea binding local — las funciones que referencian `RAYCAST_WORLD_TWO_CATALOG` necesitan `import { … } from './RaycastWorldTwoLevels'`. |
| **Tests** | `raycast-level.test.ts`, `raycast-episode.test.ts`, suite completa. |

### C — Render / minimap (pendiente / opcional)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Reducir coste o complejidad solo con perfil claro y sin cambiar frames visibles. |
| **Archivos** | `RaycastRenderer.ts`, `RaycastMinimap.ts`, eventualmente `RaycastScene.ts` (throttle del minimap). |
| **Riesgo** | Alto si se toca hot path sin baseline. |
| **Tests** | `raycast-minimap.test.ts`, tests de presentación/HUD si aplica. |

### D — Docs (parcialmente en esta iteración)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Sustituir narrativa MVP antigua por raycast-first + referencia a este documento. |
| **Archivos** | `docs/architecture.md`, `docs/roadmap.md`, `README.md` (árbol). |
| **Riesgo** | Bajo. |
| **Tests** | N/A. |

### E — Verificación final

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Confirmar lint, tests y build verdes tras cambios. |
| **Archivos** | Todo el repo. |
| **Riesgo** | Bajo. |
| **Tests** | Suite completa + build. |

---

## 3. Cambios mínimos realizados (deuda)

- **World 2** (`RAYCAST_LEVEL_WORLD2_FRACTURE`, `RAYCAST_LEVEL_WORLD2_THRESHOLD`, `RAYCAST_WORLD_TWO_CATALOG`) vive en `RaycastWorldTwoLevels.ts`; `RaycastLevel.ts` lo importa, re-exporta y usa el catálogo en `getRaycastLevelById` con binding real de import.

---

## 4. Resumen: qué mejoró / qué queda pendiente

**Mejoró**

- `RaycastLevel.ts` es más corto y legible; datos World 2 están acotados en un archivo dedicado.
- Documentación base (`architecture`, `roadmap`, README) alineada con el producto raycast-first.
- Lint, tests y build siguen verdes.

**Pendiente (fuera de esta extracción)**

- Partir `RaycastScene`, `RaycastRenderer` (por subsistemas: HUD ya parcialmente extraído, render pipeline, etc.) solo con pasos pequeños y tests.
- Bundle grande (~400 kB gzip): valorar code-splitting / `manualChunks` en otra fase con medición.
- Minimap: ya es pequeño en líneas; optimizar solo si hay evidencia de coste.

---

## 5. Stop conditions (cuándo parar el refactor)

1. **Fallo de tests, lint o build** tras un cambio → revertir ese cambio antes de seguir.
2. **`ReferenceError` / orden de inicialización / ciclo de imports en runtime** → parar; usar imports locales explícitos o dividir solo tipos (`import type`) antes de reestructurar más.
3. **Delta visible** en HUD, minimap, pacing o niveles en QA manual → parar (incumple “sin cambio visible”).
4. **Extracción que obliga a trocear tipos y runtime en muchos archivos** sin tests que cubran el nuevo grafo → reducir alcance o abortar.

---

## Referencias rápidas

- Datos World 2: `src/game/raycast/RaycastWorldTwoLevels.ts`
- Catálogo y resolución de nivel: `src/game/raycast/RaycastLevel.ts`
