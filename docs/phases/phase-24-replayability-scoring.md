# Fase 24 — Replayability & Scoring 2.0

Objetivo: **dar propósito a repetir runs**, hacer que el **score refleje skill** (no solo volumen de kills), y **explicar mejor** el resultado en el run summary — sin roguelike, sin meta-progressión pesada, sin leaderboard online, sin PG.

---

## Subfases numeradas (ejecución incremental)

| ID | Nombre | Objetivo | Archivos | Riesgos | Tests | Validación manual | Commit sugerido |
|----|--------|----------|----------|---------|-------|-------------------|-----------------|
| **24-1** | **Instrumentación pellets** | `pelletCount` por disparo; contadores sector para precision futura; boss pellet intersect count | `RaycastCombatSystem.ts`, `RaycastBoss.ts`, `RaycastScene.ts` | Doble conteo splash/boss | `raycast-combat`, `raycast-boss` | Opcional: TAB debug futuro | `feat(raycast): pellet instrumentation for scoring` |
| **24-2** | **Fórmula de score** | Bonus/topes daño recibido, accuracy proxy — **sin** cambiar kills base sin diseño | `RaycastScore.ts`, escena al aplicar | Carry score entre niveles | `raycast-score` | Dos runs comparativas | `feat(score): skill modifiers with caps` |
| **24-3** | **Run summary + medallas** | Líneas ACCURACY / MEDALS si aplica | `RaycastRunSummary.ts`, escena input | Strings en tests | `raycast-run-summary` | Overlay legible | `feat(ui): run summary skill lines` |

**Estado:** **24-1** aplicado en código (contadores **no** pasan aún al overlay público ni al score).

---

## 1. Replayability sin procedural generation

| Palanca | Qué es | Por qué encaja |
|---------|--------|----------------|
| **Mejor marca personal** | Ya hay high score local (`RAYCAST_HIGH_SCORE_STORAGE_KEY`). Extender con **mejor tiempo por sector** o **mejor rango por dificultad** en `localStorage` (claves versionadas). | Rejugabilidad “arcade”: batir tu propia marca sin contenido nuevo. |
| **Par times autorados** | Por `levelId`, tiempo objetivo **estático** en datos (`RaycastLevel` o tabla en `config.ts`). Bonus de score si terminas bajo par (o medalla). | Skill de ruta + movimiento; cero PG. |
| **Bonificaciones compuestas** | Precisión, daño recibido, secretos — entran en fórmula con **topes** para evitar farm raro. | Mastery sin inflar scope. |
| **Medallas / líneas extra** | Badges de una línea en el summary: `FLAWLESS SECTOR`, `UNDER PAR`, etc. | Feedback emocional inmediato; no es un árbol de skills. |
| **Modificador único opcional** | Un toggle en menú (ej. “Glass”: más score, menos vida inicial) — **una** variante, no 15 mutators. | Replay distinto sin segundo juego. |

Evitar: desbloqueos en cadena, crafting, seeds, biomes aleatorios.

---

## 2. Qué debería medir el score (y qué ya tienes)

| Métrica | Skill que premia | Estado actual | Nota de diseño |
|---------|------------------|---------------|----------------|
| **Eliminaciones por rol** | Priorizar amenazas caras | Ya: `RAYCAST_KILL_POINTS` | Mantener; es la base. |
| **Secretos** | Exploración | Ya: `RAYCAST_SECRET_DISCOVER_POINTS` | OK; evitar que domine el total run. |
| **Boss / arco** | Hitos | Ya: boss clear, W2 entry, full arc | OK. |
| **Daño recibido** | Supervivencia / limpieza | Se muestra en summary; **no suma al score** | Penalización suave **acotada** (ej. −N por punto de daño con floor), o bonus si `damageTaken === 0` en el sector. |
| **Precisión** | Puntería / disciplina de fuego | **24-1:** `pelletCount` + `runPelletsFired` / `runPelletsHitHostile` por sector (listo para fórmula) | Ratio futuro: hits / pellets (pared = miss implícito). |
| **Tiempo (speed)** | Eficiencia de ruta | `elapsedMs` en overlay | Bonus si `< parTimeMs` autorado (por nivel). |
| **Eficiencia de boss** | Aprender patrones | No separado | Opcional: tiempo en sala boss o daño solo durante boss — requiere ventana temporal o flag. |
| **Objetivos** | Flujo del sector | Implícito en completar nivel | Bonificación “sin muerte de jugador” ya es survival; “triggers óptimos” es difícil sin contadores extra — **baja prioridad**. |

**Principio:** el score final debe seguir siendo **intuible**: “maté bien, no me comí el mapa, fui rápido/preciso”. Evitar fórmulas opacas con 12 coeficientes.

---

## 3. Fórmula sugerida (dirección, no dogma)

Mantener **suma base actual** (kills + bonos fijos) y añadir **capas pequeñas**:

1. **Survival modifier:** ej. `max(0, 800 - damageTaken * k)` con `k` pequeño y **tope** por sector.
2. **Pace bonus:** si existe `parTimeMs` y `elapsedMs <= parTimeMs`, sumar bonus fijo o escalado por margen.
3. **Accuracy bonus:** si `shotsFired >= mínimo`, `bonus = floor(accuracyRatio * A)` con techo `A`.

Todo implementable como funciones puras en `RaycastScore.ts` que reciban números ya agregados en escena.

---

## 4. Mejorar el run summary (lectura)

Hoy `buildRaycastRunSummary` en `RaycastRunSummary.ts` lista: dificultad, score, high score, **rank por umbrales de score**, tiempo, kills, secrets, tokens, daño.

**Mejoras de lectura (sin wall of text):**

- Línea **ACCURACY xx%** (si hay datos).
- Línea **PAR +12s** o **UNDER PAR −3s** si hay par autorado.
- **MEDALS:** una sola línea compacta `MEDALS FLAWLESS · SPEED` o hasta 3 tokens.
- Opcional: **SCORE BREAKDOWN** solo en debug o segunda página — para arcade móvil mejor **no** abrumar.

`computeRaycastRunRank` hoy depende **solo** del score total; opciones:

- **A)** Mantener rank por score compuesto (si la fórmula incluye skill).
- **B)** Añadir **segunda etiqueta** opcional, ej. `PACE TIER`, derivada solo de tiempo vs par — máximo dos líneas de “tier”.

---

## 5. Rank, medallas y retos ligeros

### Rank (existente + ajuste)

- Revisar umbrales de `computeRaycastRunRank` si el score medio sube por nuevos bonuses (evitar que todo el mundo sea RANK S).
- O documentar que el rank usa **“performance score”** explícito en HUD.

### Medallas (ejemplos, binarias)

| Medalla | Condición típica |
|---------|------------------|
| **CLEAN** | `damageTaken === 0` en ese clear de nivel |
| **TEMPO** | `elapsedMs <= parTimeMs` |
| **MARKSMAN** | `hits / shots >= 0.55` y `shots >= 10` |
| **OMNIVORE** | Encontrados todos los secretos del nivel |

Mostrar 0–3 en summary; no inventario, solo texto.

### Challenge ligero (opcional, una bandera)

- **Example:** `challengeGlassRun` → empiezas con 75% vida max, `×1.15` al score final del sector (constante en `RaycastScore.ts`). Toggle en `MenuScene` / dificultad extendida.

---

## 6. Subfases de implementación (orden recomendado)

### Fase 24.1 — Instrumentación mínima en escena

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Contadores `shotsFired`, `weaponHitsOnEnemies` (o equivalente) desde el loop de combate ya existente. |
| **Archivos** | `RaycastScene.ts`, posiblemente `RaycastCombatSystem.ts` (callbacks o retorno de hit). |
| **Riesgos** | Doble conteo en escopetas multi-pellet; definir regla **una vez** y testear. |
| **Tests** | Tests de combate existentes + nuevo test unitario de función `computeAccuracyRatio`. |
| **Manual** | Disparar a pared vs enemigo; ratio creíble. |

### Fase 24.2 — Funciones puras de score

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | `finalizeSectorScore(...)` o helpers que apliquen survival/accuracy/pace **con techos**. |
| **Archivos** | `RaycastScore.ts` |
| **Riesgos** | Romper carry score entre niveles; aplicar bonuses **al cerrar sector** o al final run según diseño acordado. |
| **Tests** | `raycast-score.test.ts` ampliado. |
| **Manual** | Score HUD sube de forma comprensible al limpiar bien. |

### Fase 24.3 — Par times autorados

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Campo opcional `parTimeMs` por nivel en datos; bonus si se cumple. |
| **Archivos** | `RaycastLevel.ts` / `RaycastWorldTwoLevels.ts`, `RaycastScore.ts`, escena para pasar `elapsedMs`. |
| **Riesgos** | Par demasiado duro → frustración; empezar conservador. |
| **Tests** | Tests de nivel / episodio si exportan constantes. |
| **Manual** | Una pasada rush vs exploración. |

### Fase 24.4 — Run summary + rank

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Nuevas líneas; medallas; recalibrar `computeRaycastRunRank` si hace falta. |
| **Archivos** | `RaycastRunSummary.ts`, tests snapshot de líneas. |
| **Riesgos** | Tests que comparan array exacto de summary — actualizar expectativas. |
| **Tests** | `raycast-run-summary.test.ts`. |
| **Manual** | Pantalla final legible en ~8–12 líneas. |

### Fase 24.5 — Persistencia “best” opcional

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Guardar mejor tiempo por `levelId` o mejor rank local (segunda clave storage). |
| **Archivos** | Helper junto a high score o `RaycastScore.ts`. |
| **Riesgos** | Migración de claves; versionar `_v2`. |
| **Tests** | Storage mock como high score actual. |
| **Manual** | Superar marca muestra feedback en overlay (una línea). |

---

## 7. Qué NO hacer

- Leaderboard online, cuentas, live service.
- Meta-desbloqueos en cadena tipo roguelike.
- PG para “cada run distinta”.
- Fórmulas que requieran tooltip de cinco párrafos.
- Romper el loop rápido: el summary **no** debe ser un informe de diez pantallas.

---

## 8. Checklist de aceptación (Fase 24)

- [ ] El jugador entiende **por qué** subió o bajó el score respecto a una run anterior (al menos en categorías: combate, daño, tiempo/precision si aplica).
- [ ] High score / rank siguen teniendo sentido tras recalibrar umbrales.
- [ ] Run summary muestra **métricas skill** relevantes sin saturar.
- [ ] Medallas o líneas extra son **opcionales visualmente** (no bloquean continuar).
- [ ] `npm run lint`, `npm test`, `npm run build` verdes.
- [ ] Una partida manual: sector normal + boss + opcional World 2.

---

## Referencias en código

- Score y storage: `RaycastScore.ts`
- Summary y rank: `RaycastRunSummary.ts` (`buildRaycastRunSummary`, `computeRaycastRunRank`)
- Agregación en clear: `RaycastScene.ts` (`runScore`, `damageTaken`, `runStartedAt`, `showRunCompleteOverlay`)
- Tests: `raycast-score.test.ts`, `raycast-run-summary.test.ts`
