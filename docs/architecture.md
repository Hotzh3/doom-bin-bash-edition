# Arquitectura (estado actual — raycast-first)

Este documento describe el cliente `src/game/` tal como está orientado hoy: **`RaycastScene` como experiencia principal**, `ArenaScene` como sandbox 2D conservado para regresiones, y módulos raycast cohesionados por dominio.

## Principios

1. **Raycast como producto**: episodio compacto, niveles datos-driven, sistemas puros donde sea posible.
2. **Arena como legado controlado**: no romper flujos 2D ni tests que dependan de él.
3. **Tests en la lógica crítica**: combate, nivel, director, objetivos, episodio — sin depender del canvas para lo esencial.

## Escenas (`game/scenes/`)

| Escena | Rol |
|--------|-----|
| `MenuScene` | Entrada; arranca prólogo / raycast / arena según input. |
| `PrologueScene` | Narrativa terminal antes del episodio. |
| `RaycastScene` | FPS raycast: loop principal, HUD, pausa, minimapa, boss, transiciones. |
| `RaycastWorldLockedScene` | Presentación cuando World 2 está bloqueado por datos/config. |
| `ArenaScene` | Modo 2D sandbox (PvP/PvE legado). |

No hay `BootScene` dedicado en el flujo actual documentado aquí; la carga arranca desde el menú / Phaser boot habitual del proyecto.

## Raycast (`game/raycast/`)

Piezas representativas (no exhaustivo):

| Módulo | Responsabilidad |
|--------|-----------------|
| `RaycastMap.ts` | Grid, ray casting geométrico, tiles. |
| `RaycastLevel.ts` | Tipos de nivel, niveles Episode 1 + boss, catálogo, helpers (`getRaycastLevelById`, reachability, etc.). |
| `RaycastWorldTwoLevels.ts` | **Solo datos** de los dos sectores World 2 y su catálogo; re-exportados desde `RaycastLevel` para compatibilidad. |
| `RaycastRenderer.ts` | Columnas, texturas, atmósfera, billboards. |
| `RaycastMinimap.ts` | Minimapa 2D derivado del estado. |
| `RaycastEpisode.ts` | Progresión de episodio / siguiente nivel. |
| `RaycastHud.ts`, `RaycastPauseMenu.ts`, `RaycastRunSummary.ts` | UI en gameplay. |
| `RaycastEnemy.ts`, `RaycastCombatSystem.ts`, `RaycastMovement.ts` | Gameplay FPS. |

## Sistemas compartidos (`game/systems/`)

Incluye `GameDirector`, combate, audio, input, etc. El director de pacing se usa en raycast según configuración por nivel.

## Backend

Opcional / fuera del núcleo del juego local; el MVP histórico mencionado en documentos antiguos no es el foco del raycast actual.

## Tests (`src/tests/`)

Cobertura principal: `raycast-*.test.ts`, director, combate, enemigos, episodio. Ejecutar `npm test` antes de refactors grandes.

## Historial de docs

- Plan de equipo de 4 semanas y “MVP arena”: ver `docs/roadmap.md` (marcado como histórico).
- Presupuesto técnico / Phase 21: `docs/phase21-runtime-budget.md`.

## Índice de documentación

Ver **[docs/README.md](./README.md)** para demo scripts, release checklist, notas de fase (21–25) y ADRs.
