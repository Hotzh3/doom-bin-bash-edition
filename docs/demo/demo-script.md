     1|# Demo script (3–5 minutos) — GitHub / portfolio
     2|
     3|Guía corta para grabar o presentar el proyecto. **Modo principal:** raycast FPS (`RaycastScene`). Para tabla detallada, línea de pitch y variante ~10 min, ver también [raycast-demo-script.md](./raycast-demo-script.md).
     4|
     5|**Entorno:** `npm ci` → `npm run dev` → abrir la URL de Vite (p. ej. `http://localhost:5173`).
     6|
     7|---
     8|
     9|## Objetivo del demo
    10|
    11|Mostrar un vertical slice **jugable de punta a punta**: menú → prólogo → sector con combate y progresión → (opcional) boss y resumen de run → (opcional) teaser World 2, sin prometer mecánicas que no enseñes en pantalla.
    12|
    13|**Duración objetivo:** 3–5 minutos.
    14|
    15|---
    16|
    17|## Orden recomendado
    18|
    19|1. **Menú (`MenuScene`)**
    20|   - Indicar que **A / “3D mode”** es el producto principal; **B** es arena 2D de apoyo/regresión.
    21|   - Opcional: **D** para ciclar dificultad si quieres mostrar el preset.
    22|
    23|2. **Prólogo (`PrologueScene`)**
    24|   - Leer una línea del tono terminal / horror; **continuar** al episodio.
    25|
    26|3. **Raycast mode (`RaycastScene`)**
    27|   - Movimiento **WASD**, mirada ratón / **Q** **E** / flechas, disparo **F** / espacio / clic, armas **1–3**.
    28|   - Señalar la línea de **objetivo** / estado en HUD.
    29|
    30|4. **Combate**
    31|   - Un encuentro corto: lectura de enemigos, retroalimentación de daño, mensajes de combate si aparecen.
    32|   - Sin forzar explicación de cada rol; basta “hay presión y variedad de siluetas”.
    33|
    34|5. **Minimap / HUD**
    35|   - Abrir minimapa (**M** por defecto en ayuda) si aplica.
    36|   - Mencionar vida, arma, mensajes de sistema — **compacto**, no un simulador completo de RPG.
    37|
    38|6. **Secreto / llave / puerta**
    39|   - Mostrar **token** (pickup) → **puerta** que requiere llave → **salida** o siguiente beat, según el sector.
    40|   - Si el tiempo aprieta: una sola puerta + un secreto opcional “si está en la ruta”.
    41|
    42|7. **Boss (si hay tiempo)**
    43|   - **Episode 1** culmina en pelea de boss (p. ej. Volt Archon); enseñar fases / telegráficos a alto nivel.
    44|   - Si no da tiempo en 3 min, saltar con una toma pregrabada o mencionar “finale en sector boss”.
    45|
    46|8. **Score / run summary**
    47|   - Tras sector claro o hitos: **overlay** con puntuación, tiempo, rango/medallas si están visibles; **high score** local (**localStorage**).
    48|   - **N** para continuar cuando el overlay lo permita; **R** reinicia sector; **ESC** vuelve al menú.
    49|
    50|9. **World 2 teaser**
    51|   - Tras boss de Ep. 1, si el flujo lo permite: **N** hacia **World 2** (banner “abyss stratum” / copy fría vs forja).
    52|   - Enseñar **solo** entrada + un vistazo breve o menú de continuación; no hace falta completar un sector W2 en vivo.
    53|
    54|---
    55|
    56|## Control rápido (presentador)
    57|
    58|| Acción | Tecla / nota |
    59||--------|----------------|
    60|| Raycast: mover | WASD |
    61|| Mirar | Ratón, Q/E, flechas |
    62|| Disparar | F, espacio, clic |
    63|| Armas | 1–3 |
    64|| Mapa | M (ver ayuda **H** / **?**) |
    65|| Reiniciar sector | R |
    66|| Siguiente (overlay) | N |
    67|| Menú | ESC |
    68|| Debug | TAB (mejor apagado en demo) |
    69|
    70|---
    71|
    72|## Checklist post-demo (30 s)
    73|
    74|- Sin errores graves en consola durante el recorrido mostrado.
    75|- Quedó claro que **raycast** es el foco y **arena** es secundario.
    76|- Se vio al menos una de: **progresión llave/puerta** o **combate** + **HUD**.
    77|
    78|---
    79|
    80|## Capturas y GIFs
    81|
    82|Lista de tomas sugeridas: [screenshots-plan.md](./screenshots-plan.md). Detalle técnico y regeneración: [../assets/screenshots/SHOT_LIST.md](../assets/screenshots/SHOT_LIST.md).
    83|