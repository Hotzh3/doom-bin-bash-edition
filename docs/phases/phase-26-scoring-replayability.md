# Phase 26 — Scoring & replayability 2.0 (design note)

## 1) Estado analizado (pre-cambio)

| Área | Existente | Faltante / placeholder |
|------|-----------|------------------------|
| **RaycastScore.ts** | Puntos por kill, secret, boss clear, World2 entry, full-arc flat; `RaycastSectorMetrics`; ratios accuracy/boss; `addRaycastSectorPerformanceBonus` (accuracy + survival + boss pellets); medallas sector; high score localStorage | Sin acumulado de **campaña** (run completo); `bossDamageTaken` en métricas no usado en fórmula; **tiempo** no entra al score; medallas fijas a “Archon” en nombre |
| **RaycastRunSummary.ts** | `buildRaycastRunSummary`, rank por umbrales de score, tiempo sector, líneas accuracy/boss | Rank no considera composición skill explícita; sin bloque **run total** al terminar campaña |
| **RaycastScene.ts** | Contadores sector (pellets, daño, boss pellets, …); merge solo al bonus **por sector**; summary con datos del sector actual | Métricas se resetean cada mapa — no hay **wall-clock run** acumulado entre sectores |
| **RaycastCombatSystem.ts** | `pelletCount` por disparo — escena acumula | Nada que cambiar (instrumentación ya en escena) |
| **RaycastBoss.ts** | Daño al boss contabilizado en escena | Eficiencia ya como ratio pellets (no requiere tocar boss) |

## 2) Fórmula propuesta (legible)

- **Base (sin cambio de gameplay):** kills + secrets + bonos planos existentes (boss, World2, full arc).
- **Por sector (existente, documentado):** bonus acotado ~600 por accuracy + supervivencia + eficiencia boss **solo pellets** (sin castigar escopeta: ratio acotado a 1).
- **Cierre de campaña (nuevo, suave):** un bonus único al **último nivel** (`episodeComplete`) a partir de `RaycastCampaignMetrics`:
  - **Pace:** mejor si el tiempo total de run está por debajo de una **par** generosa (48 min), sin exigir speedrun extremo.
  - **Vault:** + si todos los secretos **disponibles en la suma de sectores** fueron hallados.
  - **Low profile:** daño total medio bajo por sector.
  - **Steady aim:** accuracy global mínima con suficientes disparos (no premia “pocos tiros”).

**Por qué no castiga agresivo:** los kills siguen siendo el grueso; el bonus de campaña tiene **techo** (~1200) y el de sector ya tenía techo (600).

## 3) Riesgos

- **Par de tiempo:** arbitraria; se elige conservadora para no bloquear rank por un solo sector largo.
- **Secretos:** la suma `secretTotal` por sectores es una aproximación de “todo el contenido relevado” — coherente con runs que continúan.
- **Scores históricos / high score:** suben ligeramente por bonus de campaña — umbrales de rank se recalibran.

## 4) Subfases (ejecución)

1. **26A:** `RaycastCampaignMetrics` + merge + carry en `RaycastSceneData`; tests de merge.
2. **26B:** `addRaycastCampaignCompletionBonus` + medallas de campaña + rank recalibrado; tests score/summary.
3. **26C:** Jerarquía visual en `buildRaycastRunSummary` + inputs de campaña en overlay final.
