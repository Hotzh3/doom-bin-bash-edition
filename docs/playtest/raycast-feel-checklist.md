# Raycast Feel Checklist

Usar este checklist antes de compartir un build o demo del vertical slice. El objetivo es detectar rápido feel roto, muertes injustas y regresiones visibles.

## Movement

- `WASD` responde sin latencia perceptible.
- Strafe lateral mantiene presión útil y no se siente más lento que avanzar.
- Retroceso y giro siguen siendo controlables durante combate cercano.
- Deslizamiento contra paredes no atasca al jugador en esquinas comunes.
- Mouse turn, `Q`/`E` y flechas permiten corregir aim sin sobresaltos.

## Combat Pressure

- Pistol sigue siendo confiable para terminar enemigos dañados.
- Shotgun se siente fuerte a corta distancia y no domina a cualquier rango.
- Launcher se lee como arma lenta/pesada y su flash no tapa por completo al objetivo.
- Pistol, shotgun y launcher se distinguen por audio al primer disparo sin introducir fire delay.
- Hit, kill, splash y wall impact se entienden por oído y pantalla incluso en encuentros caóticos.
- Windups de melee y ranged se distinguen antes del daño o disparo.
- Si el jugador esquiva un melee durante el windup, no recibe daño fantasma.

## Director

- El director recorre un ritmo legible: calma, observación, warning, ambush/presión y recovery.
- Warning, ambush y recovery tienen cues procedurales distintos y no spamean en bucle.
- Quedarse quieto demasiado tiempo primero avisa y luego escala presión; moverse corta esa escalada.
- Spawns del director no ocurren encima del jugador, sobre enemigos vivos o en celdas bloqueadas.
- Spawns del director no aparecen de frente en línea de visión sin telegraph claro.
- El director todavía respeta cooldown, cap de enemigos vivos y presupuesto total.
- Estado de presión sube al dominar, pero también entra en recovery cuando la run afloja.
- El primer mapa deja beats claros: warning temprano, preparación de ambush, spike de presión y ventana de recovery.

## Map Flow

- La ruta al token es clara desde el inicio.
- La puerta principal no abre sin token.
- Token, denied gate, gate open, secret, level clear y episode clear tienen feedback corto y legible.
- Completar el nivel 1 muestra clear state y permite avanzar al nivel 2 con `N`.
- Completar el nivel 2 cierra el mini episodio con resumen final y sin softlock.
- El exit no completa la run antes de token + puerta + ambush principal.
- Los triggers ligados a puerta no disparan antes de abrir la puerta correcta.
- Secretos son visibles para quien explora, pero no bloquean la ruta crítica.
- Los dos mapas se sienten distintos por layout, landmarks y zonas visuales.

## Darkness And Readability

- Puerta, token, secret y exit se distinguen de inmediato a media distancia.
- La puerta abierta se reconoce distinto de la puerta sellada incluso bajo presión.
- Cada rol enemigo tiene una silueta reconocible en movimiento.
- Los roles más peligrosos (`BRUTE`, `RANGED`) siguen leyendo amenaza en niebla o luz baja.
- Muzzle flash, hit flash y damage flash informan sin lavar toda la imagen.
- Las zonas se sienten distintas por paleta y patrón: metal corrupto, piedra del vacío, ámbar de aviso, verde tóxico y portal/salida.
- Key/gate/ambush/exit dejan pistas de landmark en paredes o suelo sin romper la oscuridad.
- El HUD sigue legible con mensajes críticos activos.

## Fair Deaths

- Las muertes se pueden explicar por posicionamiento, presión acumulada o mal manejo.
- No hay daño instantáneo de melee al tocar un spawn recién creado.
- Proyectiles enemigos se leen y dejan espacio razonable para reaccionar.
- Los encuentros más densos todavía dejan al menos una ruta de escape o kiteo.

## Bugs And Regressions

- No hay softlocks al recoger el token, abrir la puerta o tocar el exit.
- No aparecen enemigos atrapados dentro de paredes.
- No quedan triggers reactivándose infinitamente.
- `R` reinicia el nivel actual tanto en gameplay como en overlays finales.
- `N` solo avanza cuando corresponde y nunca salta directo al final del episodio.
- Retry y vuelta al menú siguen funcionando.
- Debug HUD toggle no rompe input normal.

## Arena Sanity Check

- `ArenaScene` sigue abriendo desde menú.
- Armas, daño y enemigos 2D mantienen el comportamiento previo esperado.
- Triggers y doors de Arena siguen funcionando con la compatibilidad nueva.
- No hay cambios visuales o de balance inesperados en el sandbox 2D.
