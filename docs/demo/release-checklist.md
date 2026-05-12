     1|# Release checklist
     2|
     3|Lista antes de un **demo en vivo**, **tag**, **PR grande** o **actualización del README con capturas**.
     4|
     5|---
     6|
     7|## Comandos obligatorios (CI local)
     8|
     9|Ejecutar en la raíz del repo:
    10|
    11|```bash
    12|npm test
    13|npm run lint
    14|npm run build
    15|```
    16|
    17|(`npm run test` es equivalente si tu `package.json` define el script `test`.)
    18|
    19|---
    20|
    21|## Smoke manual (raycast — flujo principal)
    22|
    23|- [ ] `npm run dev` — arranque sin errores fatales en terminal.
    24|- [ ] Menú: iniciar **raycast** (**A** / modo 3D).
    25|- [ ] Prólogo: avanzar al primer sector.
    26|- [ ] Movimiento, mirada, disparo, cambio de arma **1–3**.
    27|- [ ] **Pickup** de llave/token, **puerta** bloqueada que abre, al menos un **trigger** o combate con director perceptible.
    28|- [ ] **Minimapa** (**M**) y lectura básica del **HUD** (vida, objetivo).
    29|- [ ] **Salida** de sector o progresión hasta overlay de **clear**; **N** / **R** / **ESC** según copy en pantalla.
    30|- [ ] (Opcional pero recomendable) Llegar o cargar **boss** y comprobar que no rompe el flujo.
    31|- [ ] (Opcional) Tras boss: **continuar** hacia **World 2** y verificar banner / entrada si lo vas a mostrar en demo.
    32|
    33|## Smoke manual (arena 2D — regresión)
    34|
    35|- [ ] Desde menú: **B** (arena).
    36|- [ ] Reinicio **R** y combate mínimo dos jugadores o PvE según modo disponible.
    37|
    38|## Navegador
    39|
    40|- [ ] Abrir DevTools una vez: sin errores rojos persistentes en consola durante el smoke.
    41|- [ ] Sin 404 de assets locales críticos (red → filtro “failed”).
    42|
    43|---
    44|
    45|## Capturas y media (si toca release visual)
    46|
    47|- [ ] Revisar [screenshots-plan.md](./screenshots-plan.md) o [../assets/screenshots/SHOT_LIST.md](../assets/screenshots/SHOT_LIST.md).
    48|- [ ] Confirmar que los archivos referenciados en README **existen** en `docs/assets/…`.
    49|- [ ] Tras `npm run capture:media` (si lo usas): revisar tamaños y nitidez; boss/clear manual si aplica.
    50|
    51|---
    52|
    53|## Mensaje clean-room (público)
    54|
    55|- [ ] Describir el proyecto como **FPS raycast retro horror original**.
    56|- [ ] Inspiración = **sensación** de clásicos, **sin** contenido ni marcas de terceros.
    57|- [ ] No afirmar paridad con Doom / Doom 64 ni mostrar assets ajenos como propios.
    58|
    59|---
    60|
    61|## Checklist de PR (equipo / portfolio)
    62|
    63|- [ ] Objetivo del cambio acotado; sin mecánicas grandes “de paso”.
    64|- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
    65|- [ ] Si hay copy de usuario o UI: revisión rápida de tono (terminal / horror).
    66|- [ ] Si hay cambio visual fuerte: considerar nueva captura o nota en `screenshots-plan.md` / SHOT_LIST.
    67|- [ ] Documentación enlazada: `docs/README.md` y README raíz si añades rutas nuevas.
    68|
    69|---
    70|
    71|## Enlaces útiles
    72|
    73|- Demo corto: [demo-script.md](./demo-script.md)
    74|- Demo extendido: [raycast-demo-script.md](./raycast-demo-script.md)
    75|- Plan de capturas: [screenshots-plan.md](./screenshots-plan.md)
    76|- Arquitectura: [../architecture.md](../architecture.md)
    77|- Índice docs: [../README.md](../README.md)
    78|