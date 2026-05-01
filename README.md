<p align="center">
  <img src="docs/assets/doombanner.png" width="100%" alt="Project banner"/>
</p>

# doom-bin-bash-edition

Shooter FPS raycast original construido con Phaser 3, TypeScript y Vite. El foco actual del proyecto es `RaycastScene`: una experiencia first-person rápida, legible y oscura, inspirada solo a nivel de principios por shooters clásicos. `ArenaScene` se mantiene intacta como modo secundario/sandbox para sistemas 2D existentes.

## Disclaimer

Este es un proyecto original, creado con fines académicos y de portafolio. Está inspirado en la energía y estructura de arena shooters clásicos, pero no está afiliado a Doom, no es una copia ni un port de Doom, y no usa nombres, sprites, assets ni contenido copyrighted de Doom.

## Clean-room / Original Content Boundary

Este repositorio no copia código, assets, mapas, sonidos, nombres, constantes, datos propietarios ni implementaciones reverse-engineered de juegos existentes. Tampoco usa contenido de DOOM64-RE.

Las referencias se limitan a diseño de alto nivel: movimiento rápido, input inmediato, strafe central, FOV amplio, disparo instantáneo, enemigos simples pero peligrosos en grupo, triggers de emboscada, ritmo de calma a caos y atmósfera oscura/claustrofóbica pero legible. Todo código, tuning, layouts, visuales, audio, nombres y datos del juego deben ser originales del proyecto o provenir de fuentes permisivas con licencia clara.

## Descripción

`doom-bin-bash-edition` presenta ahora un modo FPS/raycast como ruta principal de desarrollo. La base del gameplay está separada en scenes, raycast modules, entities y systems de lógica pura para mantener el código claro, escalable y fácil de probar.

El foco actual está en una experiencia compacta y presentable de exploración y combate first-person: movimiento constante, strafe, cámara horizontal, disparo instantáneo, enemigos simples, puertas, llaves, secretos, triggers de emboscada, HUD, feedback audiovisual generado y un `GameDirector` básico que regula la presión del combate.

## Features Actuales

- `RaycastScene` como modo principal FPS/raycast.
- Movimiento first-person con `WASD`, giro con flechas/`Q`/`E`, strafe central y cámara horizontal.
- Mouse turn horizontal con pointer lock al hacer click dentro del canvas.
- Render raycast con atmósfera oscura, contraste jugable y billboards.
- Combate con disparo instantáneo, auto-aim permisivo, feedback de muzzle flash, hit flash, impactos y cambio de armas.
- Enemigos simples pero peligrosos en grupo, con daño al jugador, windup visible y proyectiles enemigos.
- Puertas, llaves, secretos, zonas y triggers de emboscada.
- `GameDirector` como Game Master de ritmo: calma, tensión, caos y recuperación.
- HUD raycast compacto con vida, arma, tokens, secretos, objetivo, mensajes críticos y debug oculto por toggle.
- Loop completo con `SIGNAL LOST`, retry, victoria, salida a menú y resumen final.
- Audio básico generado con WebAudio, opcional y sin archivos externos.
- `ArenaScene` conservada como modo secundario/sandbox 2D.
- Arena responsive/fullscreen con dos jugadores locales y combate PvP + PvE.
- Proyectiles, daño, muerte de jugadores/enemigos y reinicio de arena en el modo 2D.
- Arquetipos de enemigos: `GRUNT`, `BRUTE`, `STALKER`, `RANGED`.
- Siluetas diferenciadas por arquetipo usando primitives de Phaser.
- FSM simple de enemigos con estados `SPAWN`, `CHASE`, `ATTACK`, `DEAD`.
- Spawn pacing adaptativo según tiempo, kills, vida y enemigos vivos.
- Spawn telegraph visual antes de crear enemigos nuevos en sistemas 2D.
- Límite de enemigos vivos y presupuesto finito de spawns.
- Estado mínimo de partida: `GAME_OVER` y `ROUND_CLEAR`.
- Cleanup de proyectiles por bounds/lifetime.
- HUD de arena con barras de vida, kills, enemigos vivos/derrotados, estado e intensidad del director.
- Feedback visual: hit flash, muzzle flash, death burst, screenshake sutil y arena decorativa.
- Tests de lógica crítica para raycast, combate, FSM, configuración de enemigos, TargetSelector, audio config y GameDirector.

## Controles

- Menú: `SPACE` inicia `RaycastScene`; `A` abre `ArenaScene`.
- Raycast: mover con `WASD`; girar con mouse horizontal, flechas izquierda/derecha o `Q`/`E`; disparar con `F`, `SPACE` o click; cambiar arma con `1`/`2`/`3`; `R` reintenta la run; `ESC` vuelve al menú; `TAB`/backtick alterna debug.
- Arena secundaria: `R` reinicia arena; Player 1 mueve con `WASD` y dispara con `F`; Player 2 mueve con flechas y dispara con `L`.

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
      RaycastScene.ts
      ArenaScene.ts
    raycast/
      RaycastRenderer.ts
      RaycastMap.ts
      RaycastLevel.ts
      RaycastMovement.ts
      RaycastCombatSystem.ts
      RaycastEnemy.ts
      RaycastHud.ts
      RaycastRunSummary.ts
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
  tests/
    combat.test.ts
    raycast-combat.test.ts
    raycast-level.test.ts
    raycast-map.test.ts
    raycast-movement.test.ts
    enemy-config.test.ts
    enemy-fsm.test.ts
    game-director.test.ts
    target-selector.test.ts
    audio-feedback.test.ts
```

- `scenes`: coordinan el flujo visual y de gameplay (`MenuScene`, `RaycastScene`, `ArenaScene`).
- `raycast`: contiene renderer, mapa, nivel, movimiento, combate, enemigos y HUD del modo FPS.
- `entities`: representan objetos jugables y de combate del modo 2D (`Player`, `Enemy`, `Projectile`).
- `systems`: contienen lógica aislada como daño, input, HUD, FSM, puertas, llaves, triggers y dirección de spawns.
- `GameDirector`: calcula intensidad, decide si spawnear, respeta límites y selecciona tipo de enemigo en sistemas testeables.
- `TargetSelector`: elige el jugador vivo más cercano con lógica pura y testeable.
- `AudioFeedbackSystem`: genera cues cortos con WebAudio y falla de forma segura si el navegador bloquea audio.
- `tests`: cubren lógica pura para reducir riesgo sin depender de rendering de Phaser.

## Technical Highlights

- **Phaser 3 + TypeScript:** vertical slice raycast/FPS con escenas, módulos raycast y sistemas separados.
- **RaycastScene primary:** entrada principal desde menú para probar movimiento, cámara horizontal, combate, nivel, triggers y atmósfera.
- **ArenaScene preserved:** modo 2D secundario para mantener compatibilidad con el sandbox local.
- **GameDirector:** controla ritmo y eventos de presión, además de spawn budget y límite de enemigos vivos.
- **Clean-room raycast feel:** movimiento inmediato, strafe fuerte, FOV amplio, disparo instantáneo, enemigos legibles, mapa con llave/puerta/emboscada/arena/secreto/salida y atmósfera procedural original.
- **TargetSelector:** selección pura del jugador vivo más cercano, evitando targets muertos.
- **Game states:** `RUNNING`, `GAME_OVER` y `ROUND_CLEAR` con overlay claro y reinicio por `R`.
- **Critical logic tests:** cobertura de raycast, combate, FSM, configs de enemigos, selección de targets, audio config y director.
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

El proyecto está en reorientación hacia una vertical slice FPS/raycast jugable con polish visual y audio básico generado. Ya cuenta con movimiento first-person inmediato, renderer raycast, combate permisivo, enemigos legibles, puertas, llaves, secretos, triggers, director de ritmo, loop de muerte/victoria/retry, CI básico y tests de lógica crítica. `ArenaScene` sigue disponible como modo secundario. No incluye assets comerciales, mapas copiados, sistema formal de waves, powerups, boss ni multiplayer online.

## Roadmap por Fases

1. **Fase 0 - Reorientación raycast:** definir el target de feel FPS, boundary clean-room, README y menú con `RaycastScene` como foco.
2. **Fase 1 - Vertical Slice:** menú, arena, dos jugadores, disparos, daño, enemigos básicos, HUD y tests mínimos.
3. **Fase 2 - Enemigos y Director:** arquetipos `GRUNT`, `BRUTE`, `STALKER`, configuración testeable y `GameDirector` básico.
4. **Fase 3 - Hardening:** ampliar tests de lógica crítica, revisar tipos, lint, build y estabilidad.
5. **Fase 4 - Loop completo:** estado mínimo de partida, cleanup de proyectiles, target selection correcta y CI básico.
6. **Fase 5 - Polish de presentación:** feedback visual, HUD más claro, siluetas, arena decorativa, audio básico generado y README honesto.
7. **Fase 6 - Expansión futura:** contenido y sistemas nuevos marcados como próximos pasos.

## Próximos Pasos

- Playtest manual de `RaycastScene` para microajustes de ritmo, daño y distancia de spawns.
- Capturas reales del gameplay en `docs/assets`.
- Enemigos ranged y grupos más variados.
- Powerups originales.
- Polish adicional de efectos y sonido.
