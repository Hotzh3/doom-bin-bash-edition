# Fase 25 — Release Readiness & Portfolio Polish

Objetivo: que el repositorio se presente como **producto serio** (demo-ready, portfolio-ready): narrativa clara, docs alineadas con el código, flujo de demostración reproducible, sin nuevas mecánicas ni reescrituras.

---

## 1. Qué suele faltar para verse “producto” vs “prototipo”

| Gap | Remedio |
|-----|---------|
| README largo y repetitivo | Una historia única: qué es, cómo ejecutar, qué incluye, cómo verificar. |
| Docs desalineadas con el juego real | `architecture.md` + roadmap que reflejen raycast-first y enlacen fases. |
| Demo script con teclas incorrectas | Alinear con `MenuScene` (`A` raycast, `B` arena, `D` dificultad) y prólogo. |
| Sin capturas de gameplay reales | Carpeta `docs/assets/screenshots/` + README que las referencie. |
| Sin índice de documentación | `docs/README.md` como mapa. |
| Checklist de release dispersa | Un solo lugar: release checklist + este doc. |

---

## 2. Plan por subfases

| ID | Subfase |
|----|---------|
| **25.1** | README profesional (estado, features concisos, enlaces, screenshots). |
| **25.2** | Índice `docs/README.md` + punteros en architecture/roadmap. |
| **25.3** | Demo flow: script 3–5 min + corrección de controles menú. |
| **25.4** | Capturas / GIFs (artefactos binarios: generados por el autor; README describe nombres y convención). |
| **25.5** | Checklist release + smoke manual (sin cambiar gameplay). |

---

## 3. Por subfase: objetivo, archivos, riesgos, tests, validación manual

### 25.1 README

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Primer pantallazo = propuesta de valor + estado + cómo correr + verificación. |
| **Archivos** | `README.md` |
| **Riesgos** | Ninguno en código. |
| **Tests** | N/A |
| **Manual** | Copiar `npm ci && npm run dev` en máquina limpia. |

### 25.2 Docs map

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Navegación clara para revisores / entrevistadores. |
| **Archivos** | `docs/README.md`, `docs/architecture.md`, `docs/roadmap.md` |
| **Riesgos** | Enlaces rotos — revisar rutas relativas. |
| **Tests** | N/A |
| **Manual** | Abrir cada enlace desde GitHub preview. |

### 25.3 Demo script

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Demo 3–5 min reproducible; teclas = comportamiento real. |
| **Archivos** | `docs/demo/raycast-demo-script.md`, `docs/demo/release-checklist.md` |
| **Riesgos** | Confundir al presentador si menú y script difieren. |
| **Tests** | N/A |
| **Manual** | Ejecutar script una vez grabando pantalla. |

### 25.4 Screenshots / GIF

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Prueba visual de producto real (no solo moodboard). |
| **Archivos** | `docs/assets/screenshots/README.md` (convención), imágenes añadidas por el mantenedor. |
| **Riesgos** | Tamaño de repo — comprimir PNG/WebP. |
| **Tests** | N/A |
| **Manual** | Comprobar que las rutas en README cargan en GitHub. |

### 25.5 Release readiness

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Criterio “listo para mostrar”: lint, test, build, smoke. |
| **Archivos** | `docs/demo/release-checklist.md`, este archivo. |
| **Riesgos** | Ninguno. |
| **Tests** | `npm run test`, `npm run lint`, `npm run build` |
| **Manual** | Checklist completa antes de entrevista o tag. |

---

## 4. Cómo mejorar README, demo flow, docs

- **README:** estado explícito (“vertical slice completado”), lista de features **sin duplicar** español/inglés, sección **Documentation**, **Screenshots** con instrucciones si faltan assets.
- **Demo:** bloque “3–5 minutes” con beat por minuto; menú → prólogo → primer sector → una emboscada → clear (o muerte limpia).
- **Docs:** roadmap histórico separado del **estado actual**; architecture con enlaces a fases 21–25.

---

## 5. Qué debe aparecer en el README final (checklist de contenido)

- [ ] Qué es el proyecto en una oración (clean-room, raycast-first).
- [ ] Disclaimer / límites legales de inspiración.
- [ ] Cómo instalar y ejecutar (`npm ci`, `npm run dev`).
- [ ] Comandos de calidad (`test`, `lint`, `build`).
- [ ] Controles menú + raycast + arena.
- [ ] Qué incluye el slice (Episode 1, boss, World 2 si en datos, arena sandbox).
- [ ] Enlaces a `docs/architecture.md`, demo script, release checklist.
- [ ] Screenshots reales o nota honesta + carpeta destino.
- [ ] Stack técnico breve.
- [ ] Estado / mantenimiento (“portfolio freeze” o “active polish” según corresponda).

---

## 6. Demo de 3–5 minutos (guión sugerido)

| Tiempo | Acción | Qué decir (breve) |
|--------|--------|-------------------|
| **0:00–0:30** | Menú: mostrar `A` / click en modo 3D, `D` dificultad, `B` arena secundaria. | Producto principal es el episodio raycast; arena es sandbox de regresión. |
| **0:30–1:30** | Prólogo + entrada al primer sector. Movimiento, disparo, HUD objetivo. | Clean-room, audio WebAudio, lectura retro horror. |
| **1:30–3:00** | Token, puerta, un trigger / emboscada. Minimapa si aplica. | Director de pacing, sin PG. |
| **3:00–4:30** | Clear de nivel o muerte limpia + overlay; `ESC` menú. | Flujo arcade: resumen, score, high score. |
| **4:30–5:00** | (Opcional) `B` arena 10 s o “fin”. | Mismo repo mantiene modo 2D por compatibilidad. |

Detalle extendido: [docs/demo/raycast-demo-script.md](./demo/raycast-demo-script.md).

---

## 7. Checklist final de release readiness

- [ ] `npm run test` — verde  
- [ ] `npm run lint` — verde  
- [ ] `npm run build` — verde  
- [ ] CI (GitHub Actions) verde en la rama que presentas  
- [ ] Smoke manual: menú → raycast → combate → clear o muerte → menú  
- [ ] Sin errores en consola del navegador en esa pasada  
- [ ] README refleja teclas y flujo reales  
- [ ] Al menos una captura de gameplay **o** texto honesto + carpeta lista para capturas  
- [ ] Mensaje clean-room preparado para oral portfolio  

---

## Referencias

- Demo script: [docs/demo/raycast-demo-script.md](./demo/raycast-demo-script.md)  
- Release checklist: [docs/demo/release-checklist.md](./demo/release-checklist.md)  
- Documentación índice: [docs/README.md](./README.md)
