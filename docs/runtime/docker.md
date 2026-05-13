# Docker Runtime (Local Dev)

## Goal

Run the game directly in Docker and prove the runtime is reachable from the host browser.

This project is a browser client (Phaser + TypeScript + Vite). In Docker, we containerize the Vite runtime used for local development.

## Prerequisites

- Docker Desktop installed.
- Docker Desktop daemon running.
- Port `5173` available on the host.

## Quick Start

Primary command (foreground):

```bash
docker compose up --build
```

Detached mode:

```bash
docker compose up --build -d
```

Open:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)

Stop and clean:

```bash
docker compose down
```

## Validation Commands

Header check:

```bash
curl -I http://127.0.0.1:5173
```

Expected signal:

- Status line contains `HTTP/1.1 200 OK`.

What that means:

- The containerized Vite server is running.
- The port mapping `5173:5173` is correct.
- The game is reachable from host network through Docker.

## npm Helpers

Equivalent helpers in `package.json`:

- `npm run docker:up`
- `npm run docker:up:d`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:smoke`

`docker:smoke` runs a simple end-to-end Docker runtime check:

1. `docker compose up --build -d`
2. wait for `http://127.0.0.1:5173`
3. `curl -I` and assert HTTP 200
4. `docker compose down`

## Runtime Notes

- Docker image: `node:20-alpine`
- Service name: `game`
- Container name: `doom-bin-bash-game`
- Command: `npm run docker:dev` (`vite --host 0.0.0.0 --port 5173`)
- Hot reload on macOS enabled via polling env vars in compose.
- Healthcheck exists in compose for container-level liveness.

## Troubleshooting

### 1) Docker daemon not running

Symptoms:

- `Cannot connect to the Docker daemon...`

Fix:

- Start Docker Desktop.
- Wait until daemon is healthy.
- Retry `docker compose up --build`.

### 2) Port `5173` already in use

Symptoms:

- Bind or port allocation error on start.

Fix:

- Stop the process using `5173`, or
- change compose port mapping if needed.

### 3) Container starts but `curl` fails immediately

Symptoms:

- `curl` connection refused right after startup.

Why:

- Vite can need a few seconds after container start.

Fix:

- Retry after a short wait, or run `npm run docker:smoke` (includes retry loop).

### 4) Rebuild / cache issues

Symptoms:

- Dependencies look stale or behavior differs unexpectedly.

Fix:

```bash
docker compose down -v
docker compose up --build
```

## Why this is enough to claim "runs in Docker"

Because the runtime can be reproduced from a clean container build using only compose commands, and host validation shows a successful HTTP response from the containerized game endpoint.

For delivery evidence, see:

- [docker-validation.md](./docker-validation.md)
