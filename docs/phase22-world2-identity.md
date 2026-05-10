# Fase 22 — World 2 Identity

Objetivo: que World 2 se perciba como **otro infierno / bioma / dimensión**, no como un recolor de Episode 1. Alcance **autorado**, sin procedural generation, sin reescritura del renderer, sin verticalidad que rompa el raycast.

---

## Subfases numeradas (ejecución incremental)

| ID | Nombre | Objetivo | Archivos | Riesgos | Tests | Validación manual | Commit sugerido |
|----|--------|----------|----------|---------|-------|---------------------|-----------------|
| **22-1** | **Ion stratum — capa atmosférica** | Niebla/niebla lejana + pulso + siluetas **distintas de W1** solo vía `applyWorldSegmentToAtmosphere` (sin nuevo renderer) | `RaycastAtmosphere.ts`; tests | Oscurecer enemigos; **mitigar** con `enemyMinVisibility` y tope `fogEnd` | `raycast-atmosphere.test.ts` | Boss → W2: bruma fría más legible que “filtro random” | `feat(atmosphere): deepen World 2 segment layer` |
| **22-2** | **Paleta + gramática visual** | Ramas en `RaycastVisualTheme` para `basalt-rift` / `ion-shaft` / `nadir-glow`; refinos `RaycastPalette` | `RaycastVisualTheme.ts`, `RaycastPalette.ts` | FPS / ruido visual | `raycast-visual-theme.test.ts` | Comparar muro/piso vs Ep1 | `feat(theme): distinguish World 2 zone grammar` |
| **22-3** | **Landmarks & datos** | Beats, labels HUD, director pacing solo en `RaycastWorldTwoLevels.ts` | datos W2 | Romper progresión si se tocan triggers | `raycast-level`, `raycast-episode` | Dos sectores completos | `chore(levels): World 2 ambient copy and pacing` |
| **22-4** | **Presentación / dressing** | Banner, hints, opcional tint enemigo si hay hook | `RaycastPresentation.ts`, quizá escena | Tests de strings | `raycast-presentation.test.ts` | Overlay rank/banner | `feat(ui): World 2 presentation copy` |
| **22-5** | **Transición W1→W2** | Copy post-boss / locked coherent | `RaycastPresentation.ts`, `RaycastWorldLockedScene.ts`, toques mínimos escena | Flujo `N` | presentation + smoke | Caminos feliz y locked | `feat(flow): World 2 transition messaging` |

**Estado:** **22-1** implementado en la iteración actual (solo atmósfera). **22-2 en adelante** pendiente.

---

## 1. Dirección creativa y técnica

### Lectura de fantasía (jugador)

**World 1 — “Terminal Corruption Hell Arena”**  
Infierno industrial caliente: óxido, ámbar, verdosidad tóxica, arena corrupta bajo telemetría hostil.

**World 2 — “Ion Stratum / Signal Threshold”** (nombre interno ya presente en datos)  
Debajo o **al otro lado** del episodio: no más fundición — **estratos fríos**, basalto conductivo, **iones visibles** como niebla cargada, violeta que **no sustituye** al carmesí sino que **congela** la lectura del HUD. El tono pasa de “arena deportiva corrupta” a **profundidad geológica + señal astral**: menos óxido punzante, más **vacío ionizado** y **anillo nadiral** (segundo mapa).

### Dirección técnica (implementable sin nuevo motor)

| Pilar | Qué significa en código |
|-------|---------------------------|
| **Gramática visual nueva** | Mismo pipeline de columnas; **ramas nuevas** en `getRaycastWallVisualStyle` / `getRaycastGroundVisualStyle` cuando `surface.theme.id` ∈ World 2 **o** cuando `worldSegment === 'world2'` en el contexto de superficie (si ya está disponible). Patrones existentes recombinados + **1–2 patrones nuevos** muy baratos (solo matemática de sampleo). |
| **Atmósfera** | Ampliar `RAYCAST_ATMOSPHERE_WORLD2` y `applyWorldSegmentToAtmosphere`: niebla más **fría**, menos “pulse” corrupto, quizá **enemyMinVisibility** distinta para sensación de hostiles que emergen del bruma. |
| **Paleta** | Ya existe `riftFog`, `riftVeil`, `riftIon`, etc. Refinar **contraste silueta vs fondo** (legibilidad) y **no** copiar huecos W1. |
| **Pacing** | Solo datos: `director.config` por nivel World 2 (cooldowns, ventanas de recovery, `maxEnemiesAlive`) — **sin** nuevo código de IA. |
| **Historia ambiental** | Textos de `encounterBeats`, `hudObjectiveLabels`, labels de pickups/puertas (ya estilo terminal); opcional: una línea en `RaycastPresentation` para mensajes prioritarios cuando `worldSegment === 'world2'`. |
| **Transición W1→W2** | Punto emocional fuerte en **clear del boss** + primer frame del sector rift: copy en `RaycastPresentation`, posible **flash/tint** ya vía atmósfera (sin nueva capa de post). |

### Línea roja estética

Mantener **retro horror / DOOM 64-inspired / terminal corruption**: tipografía fría, mayúsculas, mensajes de sistema. World 2 es **otra capa del mismo universo corrupto**, no sci-fi limpio.

---

## 2. Sistemas a tocar (alto impacto / bajo riesgo)

| Sistema | Archivos | Por qué |
|---------|----------|---------|
| Temas de zona y superficie | `RaycastVisualTheme.ts`, `RaycastPalette.ts` | Donde se decide **cómo se ve** cada celda; aquí se evita el “solo otro color”. |
| Post/atmosfera global | `RaycastAtmosphere.ts` | Ya segmenta World 2; extender **mensajes** y parámetros de niebla/pulso. |
| Presentación / copy | `RaycastPresentation.ts`, eventualmente strings en `RaycastScene` si solo cablean datos | Banner W2, hints, mensajes de prioridad al entrar al arco. |
| Datos de nivel | `RaycastWorldTwoLevels.ts` (vía `RaycastLevel` re-export), beats, director | Pacing y **storytelling ambiental** sin código nuevo. |
| Puerta de World 2 bloqueado | `RaycastWorldLockedScene.ts` | Coherencia de tono si el jugador no tiene W2 desbloqueado. |
| Prólogo (opcional, mínimo) | `PrologueScene.ts` | Una **frase** que prepare el “estratato frío” sin spoiler largo. |

**Renderer (`RaycastRenderer.ts`)**  
Solo si hace falta **pasar** `worldSegment` al contexto de superficie ya existente; **no** reescribir el loop de rayos.

---

## 3. Alcance controlado (autorado, no explosión)

En una sola fase cabe:

- Refinar paleta + atmósfera World 2.
- Añadir **ramas visuales** por tema World 2 en theme helpers (sin nuevas columnas de render).
- Ajustar **solo texto** y **director JSON-like** en niveles World 2.
- Opcional: **enemy visual style** por segmento si ya hay hook (`RaycastEnemyVisualStyle` / silhouette) — sin nuevos meshes, solo colores/outline.

Fuera de alcance razonable para Fase 22:

- Nuevas armas, inventario, PG, multiplayer.
- Nuevos tipos de enemigo con IA nueva.
- Mapas nuevos o geometría nueva (salvo copy en mismos layouts).

---

## 4. Subfases propuestas

### 4.1 Identidad visual (gramática)

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Que basalt / ion / nadir **elijan patrones distintos** a óxido/teal W1; landmarks sigan legibles. |
| **Archivos** | `RaycastVisualTheme.ts`, `RaycastPalette.ts` |
| **Riesgos** | Patrones demasiado “ruidosos” → bajan FPS; mitigar con **misma complejidad por píxel** que patrones actuales. |
| **Tests** | `raycast-visual-theme.test.ts`, `raycast-atmosphere.test.ts` si tocan constantes exportadas. |
| **Validación manual** | Recorrer ambos sectores W2; comparar columna al lado de puerta/gate/exit vs W1. |

### 4.2 Ambiente y paleta

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Niebla/vértigo/violeta **propios**; mensajes `messages.*` específicos W2 donde aplique. |
| **Archivos** | `RaycastAtmosphere.ts`, `RaycastPalette.ts` |
| **Riesgos** | Oscurecer demás → ilegible; usar `enemyMinVisibility` y contraste de billboards. |
| **Tests** | `raycast-atmosphere.test.ts`, tests que lean `getRaycastIntroMessageForSegment` / exit. |
| **Manual** | Boss clear → N → primer sector W2: sensación de **cambio de clima**, no solo tint. |

### 4.3 Landmarks y arquitectura (lectura del espacio)

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Reforzar **ion-well / seam-gate / nadir-pit** como lectura única: beats + opcional variante visual en landmark `key`/`gate` solo en temas W2. |
| **Archivos** | `RaycastWorldTwoLevels.ts`, `RaycastVisualTheme.ts` |
| **Riesgos** | Cambiar triggers/zonas rompe routing; **no** mover geometría de mapa si la regla es “no cambiar mapas” global — solo copy y tono director. |
| **Tests** | `raycast-level.test.ts`, `raycast-episode.test.ts` |
| **Manual** | Sin minimapa: ¿sigue siendo obvio dónde está el objetivo? |

### 4.4 Presentación y “enemy dressing”

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Si existe API de estilo por enemigo/segmento: tintes outline/eye **fríos** en W2; si no, solo copy de combate/priority messages con voz “ión/stratum”. |
| **Archivos** | Donde se resuelva estilo de enemigo (p.ej. sistema raycast enemy), `RaycastPresentation.ts` |
| **Riesgos** | Confundir roles de enemigo; solo cambiar **color**, no stats. |
| **Tests** | `raycast-presentation.test.ts`, `raycast-enemy-system.test.ts` si tocan constantes. |
| **Manual** | GRUNT/RANGED/etc. siguen siendo los mismos **comportamientos**, distinta **silueta cromática**. |

### 4.5 Transición World 1 → World 2

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Pantalla post-boss / hint overlay / primera línea HUD que digan **explícitamente** que el jugador cruza a otro estrato. |
| **Archivos** | `RaycastPresentation.ts`, `RaycastScene.ts` (solo cableado), `RaycastEpisode.ts` solo si hace falta helper de copy (evitar lógica nueva). |
| **Riesgos** | Romper flujo `N` continue / world locked. |
| **Tests** | `raycast-presentation.test.ts`, `raycast-episode.test.ts` |
| **Manual** | Camino feliz: boss → continue W2; camino locked: mensaje coherente. |

---

## 5. Cómo no sobrecargar el renderer raycast

1. **No nuevas pasadas fullscreen**: seguir con niebla + tint ya existentes (`RaycastAtmosphereRenderOptions`).  
2. **Patrones = funciones puras**: más `if (theme.id === 'ion-shaft')` en `getRaycastWallVisualStyle`, **sin** bucles extra por columna.  
3. **No más samples por píxel** que los actuales; si se añade un patrón, debe ser **O(1)** como los demás.  
4. **Segment flag**: si hace falta, pasar `worldSegment` solo donde ya se construye `RaycastSurfaceContext`, no por cada entidad del juego.

---

## 6. Rendimiento y legibilidad

- **Contraste**: ion/bruma no debe **lavar** billboards; subir `enemyMinVisibility` en W2 si la niebla gana.  
- **Color**: violeta/cyan como **acento**, no como fill de pantalla completa.  
- **HUD**: revisar que `RAYCAST_CSS` o overrides W2 no rompan WCAG implícito del diseño actual (texto sigue leyéndose en esquina).

---

## 7. Propuestas concretas (borrador autor-able)

### Paleta (refinar, no reemplazar todo)

- **Basalto**: más **fractura** visual — sombras azuladas (`riftBasalt` vs negro puro).  
- **Ion**: **firma cian** (`riftIon`) en bordes de hazard y en suelo lattice, **no** en muros enteros.  
- **Nadir**: **anillo violeta** (`riftViolet`) solo en exit-zone y señales, para “final del pozo”.

### Atmósfera

- Pulso corrupto **más lento** en W2 (ya se baja un poco `pulseAlpha` en `applyWorldSegmentToAtmosphere`).  
- Mensajes director opcionales: “ION SHEAR”, “STRATUM COOLING” en lugar de réplicas W1 (tabla `messages` o beats).

### Landmarks / storytelling

- **Fracture**: beats que hablen de **costura basáltica** y **presión iónica** (ya hay hueso narrativo; empujar léxico único: seam, nadir, prism, cold).  
- **Threshold**: lexico **señal/anillo/prisma** — diferenciar del boss tech de W1.

---

## 8. Qué NO tocar (para no romper el proyecto)

| Área | Motivo |
|------|--------|
| Loop principal de raycasting / DDA | Regla explícita del proyecto. |
| Formatos de mapa / tiles / PG | Sin procedural generation. |
| Stats de armas, balance numérico de daño | Fuera de identidad visual/pacing datos conservador. |
| Boss de W1 / geometría de niveles W1 | Ancla de regresión. |
| Tests que asumen strings exactos | Si se cambia copy, **actualizar tests** en el mismo PR — no dejar rojo. |

---

## 9. Checklist de aceptación (Fase 22)

- [ ] Jugador reconoce **frío / ion / nadir** sin mirar solo el nombre del nivel.  
- [ ] **No** parece “Episode 1 con filtro violeta”: patrones o lectura espacial distinta.  
- [ ] Transición boss → W2 es **clara** (copy + atmósfera).  
- [ ] Enemigos siguen siendo **legibles** a media distancia.  
- [ ] `npm run lint`, `npm test`, `npm run build` verdes.  
- [ ] Sin regresión en `ArenaScene` ni flujo Episode 1.  
- [ ] Rendimiento estable en máquina objetivo (sin micro-stutters nuevos en column draw).

---

## Referencias en código actual

- Segmento y atmósfera W2: `RaycastAtmosphere.ts` (`RAYCAST_ATMOSPHERE_WORLD2`, `applyWorldSegmentToAtmosphere`).  
- Temas de zona W2: `basalt-rift`, `ion-shaft`, `nadir-glow` en `RaycastVisualTheme.ts`.  
- Niveles: `RaycastWorldTwoLevels.ts`.  
- Presentación W2: `buildRaycastEpisodeBanner`, hints en `RaycastPresentation.ts`.
