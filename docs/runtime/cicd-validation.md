# CI/CD Validation Checklist

## Purpose

Use this checklist to demonstrate that CI/CD is automated and working for this repository.

## What to show in presentation

- GitHub `Actions` tab with successful runs.
- A PR run showing CI checks.
- A `main` run showing CI + Pages deploy path.
- A tag run (`v*`) showing release artifact creation.

## Checklist (professor/team)

- [ ] Opening/updating a PR triggers **CI** (`ci.yml`).
- [ ] Pushing to `main` triggers **CI** (`ci.yml`).
- [ ] Pushing tag `vX.Y.Z` triggers **Release** (`release.yml`).
- [ ] Pages workflow (`cd-pages.yml`) is configured and can deploy.
- [ ] Build artifacts are visible in workflow run artifacts.
- [ ] Local quality gate passes: `npm test`, `npm run lint`, `npm run build`.

## Expected outputs

### CI (`ci.yml`)

- Tests, lint, and build pass.
- `npm audit --audit-level=high` step completes.
- On `main`, `ci-dist-<sha>` artifact exists.

### CD Pages (`cd-pages.yml`)

- Build uses repo base path for Pages.
- `upload-pages-artifact` step succeeds.
- `deploy-pages` step succeeds and provides page URL.

### Release (`release.yml`)

- Build/test/lint pass before packaging.
- `dist` artifact exists.
- zip artifact exists (`doom-bin-bash-edition-<version>.zip`).
- On tag `v*`, GitHub Release is created with attached zip.

## Commands used for local validation

```bash
npm test
npm run lint
npm run build
```

## Suggested links to open live

- Actions overview:
  - `https://github.com/<owner>/<repo>/actions`
- CI workflow file:
  - `.github/workflows/ci.yml`
- CD Pages workflow file:
  - `.github/workflows/cd-pages.yml`
- Release workflow file:
  - `.github/workflows/release.yml`
- Releases page:
  - `https://github.com/<owner>/<repo>/releases`

## Notes / limitations

- Local machine cannot prove remote GitHub runner execution by itself.
- Remote validation must be confirmed in GitHub Actions UI.
- Current CD scope is static frontend deployment only (no backend pipeline).
