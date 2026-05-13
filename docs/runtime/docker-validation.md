# Docker Validation Evidence

## Purpose

Provide a reproducible validation trail to support the statement:

"The project runs directly in Docker."

Scope is runtime/container validation only. No gameplay feature claims are added here.

## Environment Assumptions

- Docker Desktop is installed and running.
- Commands are executed from repo root.
- Host can access `127.0.0.1`.

## Validation Procedure (Exact Commands)

```bash
docker compose up --build -d
curl -I http://127.0.0.1:5173
docker compose down
```

Optional one-command smoke helper:

```bash
npm run docker:smoke
```

## Expected Output (Summarized)

### `docker compose up --build -d`

- Image build completes without error.
- Service `game` starts.
- Container `doom-bin-bash-game` is created/running.

### `curl -I http://127.0.0.1:5173`

Expected status header includes:

```text
HTTP/1.1 200 OK
```

Interpretation:

- Containerized Vite runtime is reachable from host.
- Port forwarding `5173:5173` works.

### `docker compose down`

- Service stops.
- Container/network are cleaned for next run.

## Validation Checklist

- [ ] `docker compose up --build -d` succeeds.
- [ ] `curl -I http://127.0.0.1:5173` returns `HTTP/1.1 200 OK`.
- [ ] Browser opens [http://127.0.0.1:5173](http://127.0.0.1:5173).
- [ ] `docker compose down` cleans runtime.

## Evidence Capture for Professor

Take screenshots of:

1. Terminal after `docker compose up --build -d` showing service/container running.
2. Terminal showing `curl -I http://127.0.0.1:5173` with `HTTP/1.1 200 OK`.
3. Browser with game loaded at `http://127.0.0.1:5173`.
4. Terminal after `docker compose down` showing clean stop.

Recommended: keep timestamps visible in terminal for traceability.

## What Not to Promise

- Do not claim production cloud deployment.
- Do not claim backend services exist.
- Do not claim Kubernetes/Terraform orchestration.
- Do not claim online multiplayer infra from this Docker setup.

This validation proves local containerized runtime reproducibility for the browser game.
