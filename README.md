<<<<<<< HEAD
![Doom-inspired panoramic banner](https://upload.wikimedia.org/wikipedia/en/5/57/Doom_cover_art.jpg)
=======
<p align="center">

  <img src="docs/assets/doombanner.png" width="100%"/>

</p>
>>>>>>> da3173a (docs: add README visual assets)

# doom-bin-bash-edition

Proyecto universitario de arena shooter 2D **inspirado en Doom**.

> Este proyecto **no es una copia, redistribución ni port de Doom**. Es una implementación original con identidad propia, inspirada en ideas históricas del género arena shooter clásico.

Referencia histórica:
- Doom (1993): https://en.wikipedia.org/wiki/Doom_(1993_video_game)

## Estado actual
- **Fase 1 en progreso**: vertical slice jugable.

## Stack técnico
- Phaser 3
- TypeScript
- Vite
- ESLint
- Prettier
- Vitest
- Docker / Docker Compose (fases posteriores)
- GitHub Actions (fases posteriores)

## Proyecto dividido por fases
- **Fase 0:** setup de repo y documentación base.
- **Fase 1:** vertical slice (menú, arena, 2 jugadores, disparo, daño, enemigo FSM, HUD).
- **Fase 2:** oleadas, power-ups, scoreboard completo y game over.
- **Fase 3:** IA adaptativa (director simple + mejoras de target selection).
- **Fase 4:** hardening de ingeniería (CI, coverage, Docker final, presentación).
- **Fase 5 (opcional):** extras (boss, más enemigos, eventos, historial).

## Controles actuales
- **SPACE**: solo en el menú, inicia partida.
- **R**: reinicia la arena si un jugador murió.
- **P1**: mover `WASD`, disparar `F`.
- **P2**: mover flechas `← ↑ ↓ →`, disparar `L`.

> Si P2 aparece con `HP: 0`, ya está muerto y no podrá moverse/disparar hasta reiniciar (`R`).

## Fase 1 — Entregables obligatorios
1. Bootstrap Phaser + TypeScript + Vite.
2. `MenuScene`.
3. `ArenaScene`.
4. Player 1 (WASD + disparo + vida).
5. Player 2 (flechas + disparo + vida).
6. Proyectiles.
7. Colisiones básicas.
8. Sistema de daño.
9. Muerte de jugadores/enemigos.
10. Enemigo básico con FSM: SPAWN, CHASE, ATTACK, DEAD.
11. HUD básico (vida + kills).
12. Tests mínimos (daño + FSM).


## Estructura actual
```text
src/
  main.ts
  game/
    config.ts
    scenes/
      MenuScene.ts
      ArenaScene.ts
    entities/
      Player.ts
      Enemy.ts
      Projectile.ts
    systems/
      CombatSystem.ts
      InputManager.ts
      EnemyFSM.ts
      HUDSystem.ts
    types/
      game.ts
  tests/
    combat.test.ts
    enemy-fsm.test.ts
## Correr el proyecto
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev` → entorno local con Vite.
- `npm run build` → build de producción.
- `npm run test` → tests con Vitest.
- `npm run lint` → lint del proyecto.
- `npm run format` → formato con Prettier.

