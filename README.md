<p align="center">
  <img src="docs/assets/doombanner.png" width="100%" alt="Project banner"/>
</p>

# doom-bin-bash-edition

Arena shooter 2D local construido con Phaser 3, TypeScript y Vite. El proyecto funciona como una vertical slice jugable: dos jugadores compiten y sobreviven en una arena responsive/fullscreen contra enemigos controlados por sistemas simples y testeables.

## Disclaimer

Este es un proyecto original, creado con fines académicos y de portafolio. Está inspirado en la energía y estructura de arena shooters clásicos, pero no está afiliado a Doom, no es una copia ni un port de Doom, y no usa nombres, sprites, assets ni contenido copyrighted de Doom.

## Descripción

`doom-bin-bash-edition` presenta una arena local para dos jugadores con combate PvP + PvE. La base del gameplay está separada en escenas, entidades y sistemas de lógica pura para mantener el código claro, escalable y fácil de probar.

El foco actual está en una experiencia compacta: movimiento local, disparos, daño, enemigos con arquetipos, HUD y un `GameDirector` básico que regula la presión del combate sin introducir todavía un sistema formal de waves.

## Features Actuales

- Arena responsive/fullscreen con presentación visual simple.
- Dos jugadores locales en la misma pantalla.
- Combate PvP + PvE.
- Proyectiles, daño, muerte de jugadores/enemigos y reinicio de arena.
- Arquetipos de enemigos: `GRUNT`, `BRUTE`, `STALKER`.
- FSM simple de enemigos con estados `SPAWN`, `CHASE`, `ATTACK`, `DEAD`.
- `GameDirector` / Game Master IA básico.
- Spawn pacing adaptativo según tiempo, kills, vida y enemigos vivos.
- Límite de enemigos vivos y presupuesto finito de spawns.
- HUD con vida y kills.
- Tests de lógica crítica para combate, FSM, configuración de enemigos y GameDirector.

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
    types/
      game.ts
  tests/
    combat.test.ts
    enemy-config.test.ts
    enemy-fsm.test.ts
    game-director.test.ts
```

- `scenes`: coordinan el flujo visual y de gameplay (`MenuScene`, `ArenaScene`).
- `entities`: representan objetos jugables y de combate (`Player`, `Enemy`, `Projectile`).
- `systems`: contienen lógica aislada como daño, input, HUD, FSM y dirección de spawns.
- `GameDirector`: calcula intensidad, decide si spawnear, respeta límites y selecciona tipo de enemigo.
- `tests`: cubren lógica pura para reducir riesgo sin depender de rendering de Phaser.

## Cómo Correr

```bash
npm install
npm run dev
```

Comandos de validación:

```bash
npm run test
npm run lint
npm run build
```

## Screenshots

### Arena Preview

<p align="center">
  <img src="docs/assets/im1.png" width="90%" alt="Arena gameplay preview"/>
</p>

### Combate Local

<p align="center">
  <img src="docs/assets/im2.png" width="90%" alt="Local arena combat"/>
</p>

### Enemigos y Dinámica

<p align="center">
  <img src="docs/assets/im3.png" width="90%" alt="Enemy dynamics preview"/>
</p>

## Estado Actual del Proyecto

El proyecto está en estado de vertical slice jugable. Ya cuenta con una base funcional de gameplay, enemigos diferenciados, director básico de presión y tests de lógica crítica. No incluye todavía un sistema formal de waves, powerups, overlay de game over ni audio/efectos pulidos.

## Roadmap por Fases

1. **Fase 0 - Setup:** estructura del proyecto, documentación inicial y tooling base.
2. **Fase 1 - Vertical Slice:** menú, arena, dos jugadores, disparos, daño, enemigos básicos, HUD y tests mínimos.
3. **Fase 2 - Enemigos y Director:** arquetipos `GRUNT`, `BRUTE`, `STALKER`, configuración testeable y `GameDirector` básico.
4. **Fase 3 - Hardening:** ampliar tests de lógica crítica, revisar tipos, lint, build y estabilidad.
5. **Fase 4 - Presentación:** README profesional, screenshots y preparación para revisión académica/portafolio.
6. **Fase 5 - Expansión futura:** contenido y sistemas nuevos marcados como próximos pasos.

## Próximos Pasos

- Waves formales con ritmo más legible.
- Enemigos ranged.
- Powerups.
- Overlay de game over.
- Polish de efectos y sonido.
