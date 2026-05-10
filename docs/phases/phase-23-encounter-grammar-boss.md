# Fase 23 — Encounter Grammar & Boss 2.0

Objetivo: **variar la forma de los encuentros** (no solo el contenido) y dar al boss una **firma mecánica memorable**, sin inflar números, sin reescritura del renderer, sin sistemas MMO/procedural.

---

## Subfases numeradas (ejecución incremental)

| ID | Nombre | Objetivo | Archivos | Riesgos | Tests | Validación manual | Commit sugerido |
|----|--------|----------|----------|---------|-------|-------------------|-------------------|
| **23-1** | **Boss — firma de voleas (fase 2)** | Patrón de disparo **inequívoco** en Core Overdrive sin subir daño/HP | `RaycastBoss.ts`, `raycast-boss.test.ts` | Demasiados proyectiles simultáneos | `raycast-boss.test.ts` | Boss arena: telegraph legible, esquivable | `feat(boss): phase 2 bracket rail volley signature` |
| **23-2** | **Datos — encuentros distintos** | Triggers/spawns/beats en 1–2 sectores (Ep1 o W2) **solo datos** | `RaycastLevel.ts`, `RaycastWorldTwoLevels.ts` | Progresión rota | `raycast-level`, `raycast-episode` | Pasada sector | `chore(levels): diversify encounter layouts` |
| **23-3** | **Director / pacing por nivel** | Holdout vs breathing solo números | bloques `director` en niveles | Soft-lock | `game-director.test.ts` | Oleadas no infinitas | `chore(director): tune encounter pressure windows` |

**Estado:** **23-1** aplicado en esta iteración. **23-2 / 23-3** pendientes.

---

## 1. Qué es “encounter grammar” en este proyecto

**Definición operativa:** la gramática es el **patrón repetible** que el jugador internaliza: *qué orden de decisiones* el nivel fuerza, *dónde* ocurre la tensión, y *cómo* se alternan presión y recuperación.

En código hoy, la **macro-gramática global** del sector está fijada por `buildRaycastCurrentObjective` en `RaycastObjective.ts`:

`FIND KEY → OPEN DOOR → SURVIVE AMBUSH → REACH EXIT`

Eso produce naturalmente el ritmo “llave → puerta → emboscada → salida”. La **micro-gramática** — lo que sí puede diversificarse sin tocar el motor del objetivo — vive en:

| Capa | Dónde | Qué controla |
|------|--------|----------------|
| **Espacio** | `RaycastMap` + zonas en datos de nivel | rutas largas vs cortas, choke vs plaza, flanco abierto |
| **Emboscadas scriptadas** | `triggers[]` + `spawns` | composición de roles, geometría del rectángulo de activación, orden implícito (jugador entra por norte vs sur) |
| **Director** | `director.config` + `spawnPoints` por nivel | cadencia de refuerzos, anti-camp (`DirectorPacing`), intensidad sin nuevas IA |
| **Beats de encuentro** | `encounterBeats` | tono y aviso narrativo; guían expectativa sin nueva mecánica |
| **Secretos / pickups** | `secrets`, `healthPickups`, llaves opcionales en datos | riesgo/recompensa espacial (ir a un lateral) |
| **Boss** | `RaycastBoss.ts` + `bossConfig` en nivel | fases, telegraphs, voleas, movimiento respecto al mapa |

**Encounter grammar** en Fase 23 = **componer** esas capas para que cada sector pida **distinta lectura táctica** (kite, hold, rush lateral, priorizar objetivo) aunque el HUD siga mostrando los mismos cinco estados canónicos.

---

## 2. Nuevos “tipos” de encuentro (simples, memorables)

No son tipos de código nuevos obligatorios: son **plantillas de autoría** reutilizables en datos + ajustes de director.

| Plantilla | Qué pide al jugador | Cómo implementarlo aquí (sin PG) |
|-----------|---------------------|-------------------------------------|
| **Arena de presión lateral** | No quedarse en el eje principal | Trigger ancho en lateral + spawns `STALKER`/`RANGED` en coordenadas que obliguen a girar la cámara; `spawnPoints` del director en zonas laterales |
| **Holdout corto** | Sobrevivir una ventana sin morir en el mismo ángulo | Subir brevemente `maxEnemiesAlive` o bajar `recoveryDurationMs` solo en ese nivel/tramo; anti-camp ya castiga quietud |
| **Llave “opcional” con riesgo** | Decidir si abrir shortcut o route segura | Secreto con pickup + puerta condicionada (`requiredOpenDoorIds` en pickups ya existe); o segunda llave solo para loot (datos) |
| **Flanco primero** | Entrar por atrás antes que por puerta | Dos zonas; trigger más lejano que active spawns detrás si el jugador ya pasó por la plaza |
| **Objetivo secundario que altera combate** | Sin nuevo código FSM: **orden de triggers** que abren puertas distintas | Trigger A debilita emboscada de B (menos spawns en B vía diseño) o secret que da celda antes del choke |
| **Emboscada en dos pulsos** | Leer segundo wave | Dos triggers en serie (`once: true`) con mensajes distintos en `encounterBeats` |

---

## 3. Boss 2.0 — mejorar firma sin romper fairness

### Estado actual (referencia)

- Fases 1 y 2 por **umbral de vida** (`syncRaycastBossPhase`).
- **Telegraph** antes de cada volley (`telegraphUntil` → `pendingVolleyAt`).
- Volleys en **abanico** hacia el jugador; más proyectiles si el jugador lleva **quieto** ≥ 1 s.
- Movimiento: chase + **strafe** sinusoidal, velocidad mayor en fase 2; desaceleración durante telegraph.

### Dirección “memorable pero justa”

| Idea | Efecto en firma | Fairness |
|------|-----------------|----------|
| **Patrón de volley alternado** | Fase 1: fan estrecho; Fase 2: además **par de tiros bajos laterales** (offsets angulares fijos, no aimbot nuevo) | Misma cadencia de telegraph/cooldown; solo nueva distribución angular |
| **“Core surge” legible** | Una vez por fase 2, cadena de **dos telegraphs en fila** con daño igual pero lectura “double tap” | Segundo telegraph ≥ umbral mínimo visible |
| **Espacio como antagonista** | El boss ya **colisiona con paredes**; refinar `preferredRange`/strafe en fase 2 para **orbitar** el centro del arena map | No más daño por tick; solo más baile |
| **Sin subir HP/damage** | Preferir **variar geometría de amenaza** (ángulos, pausas) antes que `maxHealth` / `BOSS_PROJECTILE_DAMAGE` |

**No hacer:** fuego omni-direccional sin telegraph, one-shots, o fases que borren el windup visual.

---

## 4. Sinergia entre enemigos (ligera)

El motor ya permite **listas de spawns** por trigger con `kind` distintos. Sinergia = **autoría**:

- **RANGED** en altillo/zona lejana + **GRUNT** en cara: priorización objetivos.
- **STALKER** lateral + **BRUTE** en centro: divide atención sin nueva IA de equipo.
- Espaciar **tiempos de emboscada** (dos triggers) para que el segundo llegue cuando el jugador está ocupado — sin código nuevo si los triggers están en orden espacial.

Evitar: comportamiento tipo “buff aura” que requiera nuevos sistemas.

---

## 5. Subfases pequeñas y seguras

### 5.1 Inventario de encuentros + autoría de niveles

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Documentar plantillas y aplicar **2–3 sectores** de Episode 1 o World 2 con ritmo distinto (solo datos). |
| **Archivos** | `RaycastWorldTwoLevels.ts`, `RaycastLevel.ts` (sectores elegidos), `RaycastEpisode.ts` solo si cambia orden de IDs (evitar si no hace falta). |
| **Riesgos** | Romper progresión de llaves/puertas; validar `progression.requiredExit*`. |
| **Tests** | `raycast-level.test.ts`, `raycast-episode.test.ts`. |
| **Manual** | Cada sector modificado: una pasada full loot + una speedrun mínima. |

### 5.2 Director / pacing por situación

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Un nivel con “holdout” (picos breves) y otro con recuperación larga (maraton); solo números en `director.config`. |
| **Archivos** | Bloques `director` en niveles datos. |
| **Riesgos** | Spawn infinito frustrante; mantener `maxTotalSpawns` acotado. |
| **Tests** | `game-director.test.ts`, `director-pacing.test.ts` si tocan invariantes exportadas. |
| **Manual** | Sensación de oleadas claras sin soft-lock. |

### 5.3 Boss 2.0 — código acotado

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Nuevo **patrón de volley** o variante de fase 2 + ajuste menor de movimiento; **no** subir daño/HP por defecto. |
| **Archivos** | `RaycastBoss.ts`, opcionalmente posición/radio en `bossConfig` del nivel boss. |
| **Riesgos** | Proyectiles imposibles de esquivar en mapa pequeño; probar en arena boss real. |
| **Tests** | `raycast-boss.test.ts`, cualquier test que fije constantes de timing. |
| **Manual** | 3 derrotas conscientes: telegraph siempre leíble; fase 2 distinta de “solo más rápido”. |

### 5.4 Objetivos HUD / hints (solo si hace falta)

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Si una plantilla confunde (ej. dos rutas), mejorar **copy** en `hudObjectiveLabels` / hints — **sin** cambiar orden FSM salvo decisión explícita y tests. |
| **Archivos** | `RaycastObjective.ts` (solo strings), niveles. |
| **Riesgos** | Cambiar `buildRaycastCurrentObjective` rompe todo el juego; tratar como **fase opcional** y con suite completa. |
| **Tests** | `raycast-objective.test.ts`. |
| **Manual** | Lista de objetivos en orden correcto por sector. |

---

## 6. Ideas concretas (arenas, pressure, flank, synergies)

- **Boss arena:** columnas o pilares ya son el mapa — hacer que el boss **prefiera orbitar** en fase 2 fuerza uso de cobertura sin editar renderer.
- **Ion estrato (W2):** triggers en pasillos **largos** con `RANGED` al fondo y `STALKER` en mitad (presión frontal + corte de retirada).
- **Threshold:** segundo pulso de triggers tras abrir puerta (cadencia narrada en beats) para “dos oleadas” legibles.
- **Sinergia:** trigger único con `[GRUNT, RANGED, STALKER]` en vértices del rect — triángulo de amenaza sin IA nueva.

---

## 7. Fairness y telegraphing

1. **Telegraphs del boss:** mantener `telegraphMs` por encima del umbral donde el jugador puede **reaccionar con strafe** (no bajar por debajo ~400 ms sin prueba humana).
2. **Daño:** cambiar **patrones** antes que `BOSS_PROJECTILE_DAMAGE`.
3. **Director:** cualquier aumento de presión va acompañado de **techo** (`maxTotalSpawns`) y mensajes de warning ya existentes en estados.
4. **Legibilidad:** roles de enemigo ya tienen siluetas — no oscurecer con más partículas.

---

## 8. Qué NO tocar (salvo decisión explícita)

- Pipeline de render raycast.
- Procedural generation.
- Macro-FSM de objetivos (`FIND KEY → …`) sin plan de tests y diseño acordado.
- Inflar HP/damage como primer resorte.
- Romper contratos de tests en copy/constants sin actualizar tests.

---

## 9. Checklist de aceptación (Fase 23)

- [ ] Al menos **dos sectores** se sienten claramente **distintos en ritmo táctico** (no solo textos distintos).
- [ ] Boss tiene **patrón de amenaza reconocible** en fase 2 además de números más agresivos.
- [ ] **Telegraphs** del boss siguen siendo esquivables de forma consistente.
- [ ] No hay aumento arbitrario de HP/damage sin justificación documentada.
- [ ] `npm run lint`, `npm test`, `npm run build` verdes.
- [ ] QA manual: Episode 1 + boss + al menos un sector World 2 tocado (si aplica).

---

## Referencias rápidas en código

- Objetivo canónico: `buildRaycastCurrentObjective`, `RaycastObjective.ts`.
- Boss: `RaycastBoss.ts` (`tickRaycastBossVolleys`, `tickRaycastBossMovement`, fases).
- Anti-camp / warning: `DirectorPacing.ts`, `GameDirector.ts`.
- Datos: niveles en `RaycastLevel.ts` / `RaycastWorldTwoLevels.ts`.
