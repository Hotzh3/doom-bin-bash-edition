# Docker Runtime (Local Dev)

## Objetivo

Levantar `doom-bin-bash-edition` (Phaser 3 + TypeScript + Vite) en un contenedor reproducible para desarrollo local con hot reload.

## Arquitectura runtime simple

- `Dockerfile`: imagen base `node:20-alpine`, instala dependencias con `npm ci` y arranca Vite.
- `docker-compose.yml`: un servicio `game`, bind mount del proyecto y volumen nombrado para `node_modules`.
- Puerto publicado: `5173:5173`.
- Hot reload en macOS: `CHOKIDAR_USEPOLLING=true`.

## Comandos exactos

Primera ejecución:

```bash
docker compose up --build
```

Con scripts npm:

```bash
npm run docker:up
```

En segundo plano:

```bash
npm run docker:up:d
```

Logs:

```bash
npm run docker:logs
```

Detener y limpiar contenedores/red:

```bash
npm run docker:down
```

## Validación esperada

1. `docker compose up` construye imagen y levanta `game`.
2. Vite inicia escuchando en `0.0.0.0:5173`.
3. Juego accesible en `http://localhost:5173`.
4. Cambios en código reflejan hot reload.
5. `npm ci` no corre en cada boot de contenedor (se usa capa cacheada + volumen de `node_modules`).

## Troubleshooting básico

- Puerto ocupado:
  - Error de bind en `5173`.
  - Solución: libera el puerto o cambia el mapeo en `docker-compose.yml`.

- No detecta cambios de archivos en macOS:
  - Verifica `CHOKIDAR_USEPOLLING=true` en `docker-compose.yml`.
  - Reinicia: `docker compose down && docker compose up --build`.

- Dependencias inconsistentes:
  - Elimina volumen y reconstruye:
  ```bash
  docker compose down -v
  docker compose up --build
  ```
