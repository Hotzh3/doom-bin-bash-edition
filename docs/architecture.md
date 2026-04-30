# Arquitectura inicial recomendada

## Principios
1. **Simple primero**: todo local (sin red) para asegurar demo.
2. **Separación por dominio**: escenas, entidades, IA, sistemas.
3. **Event-driven ligero**: bus de eventos interno para desacoplar HUD/score/oleadas.

## Módulos del cliente `game/`
- **Scenes**
  - `BootScene`: carga assets y config.
  - `MenuScene`: pantalla inicial.
  - `ArenaScene`: gameplay principal.
  - `GameOverScene`: resultados.
- **Entities**
  - `Player`, `Enemy`, `Projectile`, `PowerUp`.
- **Systems**
  - `CombatSystem` (daño/vida/muerte)
  - `WaveSystem` (spawn y dificultad)
  - `ScoreSystem`
  - `RespawnSystem`
  - `PowerUpSystem`
- **AI**
  - `EnemyFSM` estados: SPAWN/CHASE/ATTACK/DEAD
  - `TargetSelector` por distancia y desempate por vida
  - `AIDirector` ajuste de dificultad según performance
- **UI**
  - HUD vida, kills, ronda y estado de director

## Flujo de eventos (MVP)
- `ENEMY_KILLED`
- `PLAYER_DAMAGED`
- `PLAYER_DIED`
- `WAVE_STARTED`
- `WAVE_CLEARED`
- `POWERUP_SPAWNED`
- `ROUND_FINISHED`

## Backend `server/` (opcional en MVP)
- API mínima:
  - `POST /matches`
  - `GET /matches/top`
- SQLite para persistencia local.

## Decisión clave
Primero entregar **juego local sólido**, luego backend si queda tiempo.
