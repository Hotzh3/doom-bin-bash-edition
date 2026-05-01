<p align="center">
  <img src="docs/assets/doombanner.png" width="100%" alt="Project banner"/>
</p>

# doom-bin-bash-edition

Arena shooter 2D local construido con Phaser 3, TypeScript y Vite. El proyecto funciona como una vertical slice jugable: dos jugadores compiten y sobreviven en una arena responsive/fullscreen contra enemigos controlados por sistemas simples y testeables.

## Disclaimer

Este es un proyecto original, creado con fines académicos y de portafolio. Está inspirado en la energía y estructura de arena shooters clásicos, pero no está afiliado a Doom, no es una copia ni un port de Doom, y no usa nombres, sprites, assets ni contenido copyrighted de Doom.

## Descripción

`doom-bin-bash-edition` presenta una arena local para dos jugadores con combate PvP + PvE. La base del gameplay está separada en scenes, entities y systems de lógica pura para mantener el código claro, escalable y fácil de probar.

El foco actual está en una experiencia compacta y presentable: movimiento local, disparos, daño, enemigos con arquetipos, HUD, feedback audiovisual generado y un `GameDirector` básico que regula la presión del combate sin introducir todavía un sistema formal de waves.

## Features Actuales

- Arena responsive/fullscreen con presentación visual simple.
- Dos jugadores locales en la misma pantalla.
- Combate PvP + PvE.
- Proyectiles, daño, muerte de jugadores/enemigos y reinicio de arena.
- Arquetipos de enemigos: `GRUNT`, `BRUTE`, `STALKER`.
- Siluetas diferenciadas por arquetipo usando primitives de Phaser.
- FSM simple de enemigos con estados `SPAWN`, `CHASE`, `ATTACK`, `DEAD`.
- `GameDirector` / Game Master IA básico.
- Spawn pacing adaptativo según tiempo, kills, vida y enemigos vivos.
- Spawn telegraph visual antes de crear enemigos nuevos.
- Límite de enemigos vivos y presupuesto finito de spawns.
- Estado mínimo de partida: `GAME_OVER` y `ROUND_CLEAR`.
- Cleanup de proyectiles por bounds/lifetime.
- HUD con barras de vida, kills, enemigos vivos/derrotados, estado e intensidad del director.
- Feedback visual: hit flash, muzzle flash, death burst, screenshake sutil y arena decorativa.
- Audio básico generado con WebAudio, opcional y sin archivos externos.
- Tests de lógica crítica para combate, FSM, configuración de enemigos, TargetSelector, audio config y GameDirector.

## Controles

- `SPACE`: iniciar partida desde el menú.
- `R`: reiniciar arena.
- Player 1: mover con `WASD`, disparar con `F`.
- Player 2: mover con flechas, disparar con `L`.

## Stack Técnico

- Phaser 3
- TypeScript
- Vite
- Vitest
- ESLint
- Prettier
- GitHub Actions para CI básico

## Arquitectura

```text
src/
  game/
    scenes/
      MenuScene.ts
      ArenaScene.ts
    entities/
      Player.ts
      Enemy.ts
      Projectile.ts
      enemyConfig.ts
    systems/
      CombatSystem.ts
      EnemyFSM.ts
      GameDirector.ts
      HUDSystem.ts
      InputManager.ts
      TargetSelector.ts
      AudioFeedbackSystem.ts
    types/
      game.ts
  tests/
    combat.test.ts
    enemy-config.test.ts
    enemy-fsm.test.ts
    game-director.test.ts
    target-selector.test.ts
    audio-feedback.test.ts
```

- `scenes`: coordinan el flujo visual y de gameplay (`MenuScene`, `ArenaScene`).
- `entities`: representan objetos jugables y de combate (`Player`, `Enemy`, `Projectile`).
- `systems`: contienen lógica aislada como daño, input, HUD, FSM y dirección de spawns.
- `GameDirector`: calcula intensidad, decide si spawnear, respeta límites y selecciona tipo de enemigo.
- `TargetSelector`: elige el jugador vivo más cercano con lógica pura y testeable.
- `AudioFeedbackSystem`: genera cues cortos con WebAudio y falla de forma segura si el navegador bloquea audio.
- `tests`: cubren lógica pura para reducir riesgo sin depender de rendering de Phaser.

## Technical Highlights

- **Phaser 3 + TypeScript:** vertical slice 2D con escenas, entidades y sistemas separados.
- **GameDirector:** controla intensidad, pacing de spawn, presupuesto total y límite de enemigos vivos.
- **TargetSelector:** selección pura del jugador vivo más cercano, evitando targets muertos.
- **Game states:** `RUNNING`, `GAME_OVER` y `ROUND_CLEAR` con overlay claro y reinicio por `R`.
- **Critical logic tests:** cobertura de combate, FSM, configs de enemigos, selección de targets, audio config y director.
- **Quality gates:** `npm run test`, `npm run lint`, `npm run build` y CI básico con GitHub Actions.

## How To Run

```bash
npm ci
npm run dev
```

Comandos de validación:

```bash
npm run test
npm run lint
npm run build
```

## Visual Inspiration / Moodboard

Las imágenes siguientes son material visual local para presentación e inspiración de estilo. **Visual inspiration / moodboard, not gameplay screenshot.** No deben leerse como capturas reales del gameplay.

### Moodboard 1

<p align="center">
  <img src="docs/assets/im1.png" width="90%" alt="Visual inspiration moodboard 1"/>
</p>

### Moodboard 2

<p align="center">
  <img src="docs/assets/im2.png" width="90%" alt="Visual inspiration moodboard 2"/>
</p>

### Moodboard 3

<p align="center">
  <img src="docs/assets/im3.png" width="90%" alt="Visual inspiration moodboard 3"/>
</p>

## Gameplay Screenshots

No hay screenshots reales del gameplay versionadas todavía en `docs/assets`. Cuando se agreguen capturas reales del juego, deben colocarse en esta sección y etiquetarse explícitamente como gameplay screenshots.

## Estado Actual del Proyecto

El proyecto está en estado de vertical slice jugable con polish visual y audio básico generado. Ya cuenta con una base funcional de gameplay, enemigos diferenciados, director básico de presión, estado mínimo de partida, CI básico y tests de lógica crítica. No incluye todavía un sistema formal de waves, powerups, enemigos ranged, boss ni multiplayer online.

## Roadmap por Fases

1. **Fase 0 - Setup:** estructura del proyecto, documentación inicial y tooling base.
2. **Fase 1 - Vertical Slice:** menú, arena, dos jugadores, disparos, daño, enemigos básicos, HUD y tests mínimos.
3. **Fase 2 - Enemigos y Director:** arquetipos `GRUNT`, `BRUTE`, `STALKER`, configuración testeable y `GameDirector` básico.
4. **Fase 3 - Hardening:** ampliar tests de lógica crítica, revisar tipos, lint, build y estabilidad.
5. **Fase 4 - Loop completo:** estado mínimo de partida, cleanup de proyectiles, target selection correcta y CI básico.
6. **Fase 5 - Polish de presentación:** feedback visual, HUD más claro, siluetas, arena decorativa, audio básico generado y README honesto.
7. **Fase 6 - Expansión futura:** contenido y sistemas nuevos marcados como próximos pasos.

## Próximos Pasos

- Waves formales con ritmo más legible.
- Enemigos ranged.
- Powerups.
- Capturas reales del gameplay en `docs/assets`.
- Polish adicional de efectos y sonido.
