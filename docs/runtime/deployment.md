# Deployment

## Deployment model

This project deploys as a static browser app.

- Local development uses Vite dev server.
- Local production preview uses `vite preview` against `dist/`.
- GitHub Pages publishes the same `dist/` output with a repo-specific base path.
- GitHub Releases attach the same `dist/` bundle as a downloadable artifact.

## Assumptions

- The host can serve static files.
- The host does not need server-side rendering.
- The host does not need API routes.
- The host does not rewrite game state.
- The browser owns all gameplay simulation.

## Build outputs

Recommended build flow:

```bash
npm ci
npm run build
```

For GitHub Pages style deploys:

```bash
npm run build:preview
```

Build output:

```text
dist/
  index.html
  assets/
  runtime-manifest.json
```

The manifest is a lightweight deploy aid. It tells you exactly what commit and
channel produced the artifact.

## Suggested release flow

1. Merge to `main`.
2. Let preview deploy run on `main`.
3. Smoke test the browser build.
4. Tag a release, for example `v0.1.0`.
5. Let GitHub Actions create the release artifact automatically.

## Static hosting notes

- `BASE_PATH=/` for release artifacts or local root hosting.
- `BASE_PATH=/<repo-name>/` for GitHub Pages.
- Use immutable asset names from Vite for cache efficiency.
- Keep the host cache simple: HTML should refresh with deploys, assets can be cached long-term.

## Observability

The runtime is intentionally lightweight:

- a small footer in the menu shows build metadata
- local playtest telemetry stays in `localStorage`
- `dist/runtime-manifest.json` makes the build traceable after deployment

There is no backend observability because there is no backend. If the project
ever adds one, telemetry should stay optional and additive.

## Future deploy expansion

If the project grows beyond a static slice, the next steps should stay minimal:

- optional API for leaderboard sync
- optional CDN cache rules
- optional release signing

Those would be follow-on concerns, not prerequisites for the current portfolio
deploy.
