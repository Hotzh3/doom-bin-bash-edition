     1|# Plan de screenshots y GIFs (showcase)
     2|
     3|Este documento lista **qué capturas conviene tener** para README, releases o redes. **No asume que los archivos ya existen** — son objetivos de producción. Cuando generes assets, colócalos bajo `docs/assets/` siguiendo [../assets/screenshots/README.md](../assets/screenshots/README.md) y [../assets/gifs/README.md](../assets/gifs/README.md), o actualiza [../assets/screenshots/SHOT_LIST.md](../assets/screenshots/SHOT_LIST.md) para alinear nombres y rutas.
     4|
     5|---
     6|
     7|## Screenshots (estáticos)
     8|
     9|| # | Tema | Qué debe verse | Notas |
    10||---|------|----------------|--------|
    11|| 1 | **Menú** | Opciones 3D / 2D, dificultad si es visible | Primera impresión “producto serio”. |
    12|| 2 | **Prólogo** | Texto terminal, 1 pantalla legible | Tono horror/ corrupción sin spoilers largos. |
    13|| 3 | **Combate raycast** | Columnas / enemigo / retícula o arma | Resolución estable (p. ej. 1280×720). |
    14|| 4 | **Minimap / HUD** | Minimapa abierto o HUD con objetivo | Mostrar que hay orientación, no solo disparar. |
    15|| 5 | **Boss fight** | Fase legible (telegráfico o entorno) | Una toma clara vale más que muchas borrosas. |
    16|| 6 | **World 2** | Banner o primera sala con paleta “abismo” | Contraste con Ep. 1; opcional si desbloqueas el flujo. |
    17|| 7 | **Run summary** | Score, tiempo, rango / medallas si aplica | Cierra el mensaje “hay meta y rejugabilidad ligera”. |
    18|
    19|**Opcional:** pantalla de **World 3** / “Ember Meridian” si muestras progresión completa; **death overlay** para tono; **pause** solo si aporta al portfolio.
    20|
    21|---
    22|
    23|## GIFs (cortos, loop friendly)
    24|
    25|| # | Tema | Contenido sugerido | Duración orientativa |
    26||---|------|---------------------|----------------------|
    27|| 1 | **Weapon feel** | Disparo + retroceso visual / feedback de arma | 2–4 s |
    28|| 2 | **Enemy encounter** | Aparece enemigo, intercambio breve, kill o ruptura | 3–5 s |
    29|| 3 | **Boss phase** | Cambio de fase o telegráfico reconocible | 3–6 s |
    30|| 4 | **World transition** | Menú → prólogo → primer frame jugable **o** continuar Ep.1 → W2 | 4–8 s |
    31|
    32|Mantén peso razonable (p. ej. ancho ≤960px, paleta ya oscura). El repo incluye script de captura automatizada parcial: `npm run capture:media` (ver README y `scripts/capture-portfolio.mjs`); **boss y clear** suelen requerir toma manual.
    33|
    34|---
    35|
    36|## Coherencia con el README
    37|
    38|Cuando añadas archivos reales, actualiza el **README** con rutas exactas y no inventes totales de tamaño: vuelve a medir tras exportar WebP/GIF.
    39|
    40|---
    41|
    42|## Ver también
    43|
    44|- [release-checklist.md](./release-checklist.md) — comprobaciones antes de publicar.
    45|- [demo-script.md](./demo-script.md) — orden de demo en vivo.
    46|