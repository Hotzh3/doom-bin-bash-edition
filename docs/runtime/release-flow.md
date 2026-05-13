# Release Flow

## Goal

Keep CI/CD simple, auditable, and portfolio-ready for a static browser game.

- `CI` valida calidad.
- `CD` publica preview en GitHub Pages.
- `release.yml` genera artifacts descargables cuando se corta un tag de versión o cuando se dispara manualmente.
This repo separates:

- **CI**: quality validation before/while integrating code.
- **CD**: artifact generation + deployment automation.

## Workflows in this repo

- `CI`: [../../.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- `Release`: [../../.github/workflows/release.yml](../../.github/workflows/release.yml)
- `CD Pages`: [../../.github/workflows/cd-pages.yml](../../.github/workflows/cd-pages.yml)

## What counts as CI here

Workflow: `ci.yml`

Triggers:

- `pull_request`
- `push` to `main`
- `workflow_dispatch`

Validation steps:

- construir artifacts descargables bajo demanda
- publicar preview estático en GitHub Pages sobre `main`
- crear releases versionadas cuando llega un tag

CD responde la pregunta: "¿qué build entregable salió de esta versión o ejecución manual?"
1. `npm ci`
2. `npm run test`
3. `npm run lint`
4. `npm run build`
5. `npm audit --audit-level=high`

Extra output:

- On `main` push, uploads `ci-dist-<sha>` artifact (short retention) for quick traceability.

CI answers: "Is this change healthy to integrate?"

## What counts as CD here

- ejecuta CI
- mantiene el deploy preview/live en GitHub Pages vía `cd-pages.yml`

No ejecuta `release.yml`. Esto evita que el badge de Release se vuelva rojo por builds de main que no representan una versión publicada.
### 1) Release automation (`release.yml`)

Triggers:

- `push` to `main`
- `push` tags `v*`
- `workflow_dispatch`

Cada tag `v*.*.*`:
Before publishing artifacts it runs the same quality gate (`test/lint/build`).

Outputs:

- `dist/` artifact
- zipped build artifact (`doom-bin-bash-edition-<version>.zip`)
- when trigger is a tag `v*`, a GitHub Release is created and zip is attached

CD answers: "What downloadable build did this commit/tag produce?"

### 2) GitHub Pages deployment (`cd-pages.yml`)

Triggers:

- `push` to `main`
- `workflow_dispatch`

Flow:

1. `npm ci`, `test`, `lint`, `build`
2. Build with Pages base path (`BASE_PATH=/<repo-name>/`)
3. Upload Pages artifact
4. Deploy with `actions/deploy-pages`

This is the automated preview/demo deployment path for the static site.

## Tag strategy for releases

Recommended tags:

- `v0.1.0`
- `v0.2.0`
- `v0.2.1`

Cut a release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Expected result:

- `release.yml` run on that tag
- zipped build artifact uploaded
- GitHub Release created automatically with notes

## Where to download artifacts

- **Actions run artifacts**: GitHub repo -> `Actions` -> select run -> `Artifacts`
- **Versioned release asset**: GitHub repo -> `Releases` -> select tag -> download attached zip

## If GitHub Actions fails

- `release-dist-vX.Y.Z` en tags
- `release-zip-vX.Y.Z` en tags
- `manual-dist-manual-<sha7>` en `workflow_dispatch`
- `manual-zip-manual-<sha7>` en `workflow_dispatch`
1. Open the failed run in `Actions`.
2. Find failing step and inspect logs.
3. Re-run locally:

```bash
npm ci
npm run test
npm run lint
npm run build
```

- `push` de tags `v*.*.*`
- `workflow_dispatch`
4. Fix issue, push again.
5. Re-run workflow if needed.

## Current limits (honest scope)

- No backend deployment pipeline (by design).
- Pages deploy is static frontend only.
- Release assets are build artifacts, not installer packages.
- Runtime validation in GitHub still depends on GitHub runner environment.
