# Runtime Architecture

## Summary

`doom-bin-bash-edition` is a browser-only FPS runtime built for static hosting.
The application ships as Vite-generated assets and runs fully inside the browser
with no required backend service.

## Core constraints

- Browser runtime only.
- Deterministic gameplay and local persistence.
- Fast cold start for portfolio/demo use.
- Static asset delivery on GitHub Pages or any similar host.
- Keep runtime observability lightweight and local.

## Build versus runtime

The project now treats build and runtime as separate concerns:

- **Build time** compiles TypeScript and emits browser assets into `dist/`.
- **Runtime** is the browser executing `index.html`, bundled JS, CSS, and assets.
- **Metadata** is generated into `dist/runtime-manifest.json` so each build is traceable.

This separation keeps deploy artifacts predictable and makes it easy to inspect a
specific build after the fact.

## Runtime metadata contract

The runtime exposes a small set of metadata values:

- app version
- commit SHA
- build date
- runtime channel (`development`, `preview`, `release`)
- base path
- telemetry mode

The menu surface shows a compact footer so the current build is visible without
opening devtools.

## Environment handling

Environment values are intentionally small and explicit.

- `BASE_PATH` controls Vite asset paths.
- `VITE_APP_VERSION` labels the build.
- `VITE_APP_BUILD_SHA` identifies the exact commit.
- `VITE_APP_BUILD_DATE` records when the build happened.
- `VITE_APP_RUNTIME_CHANNEL` distinguishes local, preview, and release builds.
- `VITE_APP_TELEMETRY` records the local observability mode.

Local overrides live in `.env.local`, `.env.development.local`, or
`.env.production.local`. The repo includes `.env.example` as the contract.

## Artifact structure

Expected production artifact:

```text
dist/
  index.html
  assets/
  runtime-manifest.json
```

This is intentionally boring. A static host should only need to serve the
directory as-is.

## Why no backend

The project does not need server-authored state to prove the product slice.
The current loop is:

- input
- combat
- score
- local persistence
- replay

A backend would add operational load without improving the showcase value of the
vertical slice.

## Future expansion paths

If the project ever needs more infrastructure, the clean path is:

- optional leaderboard API
- optional authenticated save sync
- optional telemetry export endpoint

Those should remain additive. The browser client should keep working as a static
site even if those extras never ship.

## Docker runtime references

For local containerized runtime operations and evidence:

- [docker.md](./docker.md)
- [docker-validation.md](./docker-validation.md)
