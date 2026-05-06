# Propuesta: loot variado, más armas e inventario pequeño para Raycast

## Resumen ejecutivo
El modo raycast ya tiene una base sólida para expandir contenido sin reescribir el loop principal:
- armas con roles claros y sin recarga;
- pickups de vida;
- llaves, puertas, secretos y triggers;
- HUD compacto pero ya bastante cargado;
- un sistema de combate y director que funciona con un solo arma equipada a la vez.

La mejor extensión, con bajo riesgo, no es meter un inventario grande ni un sistema de munición complejo desde el inicio. Lo más limpio es introducir:
1. loot variado por categorías;
2. 1-2 armas nuevas con identidades muy distintas;
3. un inventario pequeño tipo “belt” de consumibles/llaves especiales, no un inventario general.

## Qué hay hoy
### Armas
- `WeaponKind` actual: `PISTOL`, `SHOTGUN`, `LAUNCHER`.
- `WeaponSystem` maneja arma activa, cooldown por arma y disparo sin recarga.
- `WeaponConfig` ya separa:
  - daño,
  - cadencia,
  - velocidad de proyectil,
  - spread,
  - tolerancia de aim,
  - radio de explosión.
- `RaycastCombatSystem` usa un sistema puro de resolución, con impacto directo y splash del launcher.
- El HUD sólo muestra el arma equipada como texto, no una lista de armas ni inventario.

### Loot / pickups
- Hoy el modo raycast tiene básicamente:
  - llaves/tokens de progresión;
  - pickups de vida (`repair-cell`, `health-pack`);
  - secretos.
- Los health pickups son únicos por nivel y se consumen una vez.
- No existe munición, ni loot aleatorio, ni consumibles de combate.

### HUD / espacio disponible
- Zona superior derecha: salud, arma, minimapa.
- Zona inferior izquierda: objetivo, hint e instrucciones.
- El HUD ya está cerca del límite de legibilidad; cualquier inventario debe ser pequeño y muy compacto.

## Diagnóstico de diseño
### Lo que funciona bien
- El juego ya tiene un lenguaje claro de “pickup = feedback + mensaje + objetivo”.
- La estructura por sistemas y datos de nivel permite añadir nuevos pickups sin tocar el rendering principal.
- El combate está desacoplado y ya soporta ampliar `WeaponKind`.

### Riesgos si se añade demasiado
- Un inventario grande competiría con el minimapa, la salud y el objetivo.
- Un sistema de munición clásico introduciría fricción nueva que hoy el juego no necesita.
- Si las nuevas armas no tienen una función táctica muy marcada, se volverán variantes cosméticas del pistol/shotgun/launcher.

## Propuesta de diseño

### 1) Loot variado por “familias”
Separar los pickups en familias muy claras:

1. Progresión
- tokens / keys / access items;
- siguen siendo únicos por nivel;
- no van al inventario de combate.

2. Supervivencia
- health pack;
- repair cell;
- overshield pequeño o temporal.

3. Combate
- weapon pickup;
- ammo-less weapon unlocks;
- powerups temporales.

4. Utilidad táctica
- scan ping / reveal de secretos cercanos;
- key duplicator / bypass temporal para una puerta;
- impulso corto de movimiento;
- resistencia breve al daño.

Recomendación: mantener “ammo-less” el núcleo del juego. Si se introduce munición, que sea opcional y muy ligera, no obligatoria para el ritmo actual.

### 2) Armas nuevas: pocas pero muy diferenciadas
Recomiendo añadir primero 1 o 2 armas más, no 4 o 5.

Opción A: `CARBINE`
- rol: precisión media / cadencia media;
- mejor que el pistol contra enemigos medianos a distancia media;
- peor que el shotgun a corta distancia;
- útil para jugadores que quieran un arma “default” más potente pero menos precisa que el pistol;
- diseño técnico simple: 1 proyectil, menor cooldown, daño medio, tolerancia media.

Opción B: `ARC` o `BLASTER`
- rol: control de área / anti-grupo;
- daño bajo-medio, pequeña dispersión o rebote muy limitado;
- podría tener mini-splash o chain light si el motor lo permite;
- aporta una razón real para cambiar de arma sin convertir todo en DPS puro.

Opción C: `DASHER` / `RIPPER` como arma de riesgo
- rol: alta cadencia a corta distancia;
- penaliza precisión o consume un recurso especial;
- mejor como arma avanzada o pickup secreto.

Prioridad recomendada:
- fase 1: `CARBINE`
- fase 2: `ARC` o `BLASTER`

### 3) Inventario pequeño, no inventario general
No haría un inventario “tipo RPG”. Haría un cinturón de 3 ranuras máximas para consumibles o utilidades.

Formato recomendado:
- 1 slot de cura;
- 1 slot de utilidad;
- 1 slot flexible o especial.

Ejemplos de items:
- `MEDKIT` → cura instantánea;
- `SHIELD_CELL` → absorbe un golpe o da 10s de reducción de daño;
- `SCAN_PULSE` → revela pickups/secrets/enemigos cercanos durante 6s;
- `KEY_BYPASS` → abre una puerta concreta sin token, para secretos o rutas alternativas.

Regla clave:
- el jugador recoge automáticamente los items del inventario si hay hueco;
- si no hay hueco, el pickup no desaparece o se convierte en un “drop” activable;
- usar item sería con teclas simples `4`, `5`, `6` o `Q/E` para ciclos, pero sólo si el HUD lo tolera.

### 4) Pickup de armas y desbloqueo permanente por nivel
Las armas nuevas deberían comportarse así:
- al recoger una, se desbloquea para la run actual;
- no se requiere munición;
- se puede equipar con `1/2/3/4...`;
- en el HUD se muestra una tira compacta con slots y estado “owned/equipped”.

Si se quiere más tensión, una variante más avanzada es:
- armas poderosas aparecen como pickups limitados en nivel;
- si no se usan, no se pierden;
- el jugador puede llevar sólo 2-4 armas, no todas.

## Implementación recomendada, con mínimo riesgo

### Fase 1: data model de loot y armas
Añadir tipos puros y tests sin tocar mucho la escena.
- `LootKind`
- `PickupKind`
- `WeaponKind` ampliado
- metadatos por loot: label, color, rarity, auto-consume, stackable, HUD tag.

Objetivo:
- que los nuevos pickups existan como datos antes de existir visualmente.

### Fase 2: weapon unlocks sin inventario complejo
- ampliar `WeaponSystem` para soportar armas desbloqueadas;
- mantener arma equipada y una lista de owned weapons;
- `switchBySlot` debe ignorar slots bloqueados;
- `RaycastCombatSystem` sigue igual en resolución.

Esta fase ya permite pickups de armas sin meter inventario de items.

### Fase 3: cinturón pequeño de consumibles
- inventario de 3 slots máximo;
- cada slot guarda 1 tipo de consumible o stack pequeño;
- pickups de utilidades se autoasignan;
- uso con una tecla simple;
- HUD: tres mini iconos o tres sigilos bajo el arma o junto al minimapa.

### Fase 4: variedad de loot en niveles
- secrets que entregan utilidades raras;
- health packs de distinto tamaño;
- weapon caches;
- powerups temporales en zonas de combate;
- ruta de backtracking con recompensa visible en minimapa.

## Recomendación concreta de HUD
Para no romper el layout actual:
- no mover salud/arma/minimapa;
- añadir un strip mínimo de inventario debajo del indicador de arma o pegado al borde inferior derecho;
- usar iconos de 16-20 px y texto muy corto;
- mostrar sólo estado resumido: `1 MED`, `2 SHD`, `3 SCN`.

Si el HUD se satura, mejor mostrar inventario sólo cuando exista algo que usar, y ocultarlo cuando esté vacío.

## Loot table sugerida para el primer paso
### Comunes
- `REPAIR_CELL` → cura pequeña;
- `MEDKIT` → cura media;
- `AMMOLESS_WEAPON_CACHE` → desbloquea arma nueva;
- `SCAVENGE_CACHE` → item utilitario aleatorio.

### Infrecuentes
- `SHIELD_CELL` → reducción de daño temporal;
- `SCAN_PULSE` → revelado temporal;
- `MOBILITY_BOOST` → sprint o aceleración breve.

### Secretos
- `OVERCLOCK` → mejora temporal de cadencia;
- `BYPASS_CHIP` → abre ruta secundaria o puerta secreta;
- `AUTOREPAIR` → cura gradual fuera de combate.

## Qué evitar
- No introducir inventario grande con drag & drop.
- No introducir recarga estándar si el juego ya está pensado para fuego inmediato.
- No transformar el raycast en un looter-shooter complejo.
- No duplicar demasiadas armas sin roles tácticos reales.

## Conclusión
La dirección más segura y útil es:
- más loot, sí;
- más armas, sí, pero pocas y muy distintas;
- inventario pequeño, sí, pero sólo para consumibles/utilidades.

Eso encaja con el ritmo actual, conserva la fantasía arcade y mantiene el HUD legible.

## Siguiente paso recomendado
Implementar primero:
1. arma nueva tipo `CARBINE` o `ARC`;
2. pickup de arma como unlock permanente de la run;
3. 2 consumibles nuevos con cinturón de 3 slots.

Con eso ya se siente una expansión real sin comprometer el loop base.