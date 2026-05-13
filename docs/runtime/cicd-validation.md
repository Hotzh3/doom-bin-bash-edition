# CI/CD Validation Checklist

## Purpose

Use this checklist to prove that CI/CD is automated and that GitHub Pages is the
static deploy path for the browser game.

## Local validation

Run before opening or merging a deploy PR:

```bash
npm test
npm run lint
npm run build
npm run pages:build
```

Expected local Pages evidence:

- `dist/index.html` exists.
- `dist/runtime-manifest.json` exists.
- `dist/index.html` references `/doom-bin-bash-edition/assets/...`.

## GitHub Pages checklist

- [ ] `Settings -> Pages -> Source` is set to `GitHub Actions`.
- [ ] `cd-pages.yml` runs on push to `main`.
- [ ] `cd-pages.yml` can be triggered with `workflow_dispatch`.
- [ ] `build` job uploads `dist/` with `actions/upload-pages-artifact`.
- [ ] `deploy` job uses `actions/deploy-pages`.
- [ ] Deployment environment is `github-pages`.
- [ ] Page opens at `https://Hotzh3.github.io/doom-bin-bash-edition/`.

## Remote verification commands

Requires authenticated GitHub CLI:

```bash
gh auth status
gh run list --workflow cd-pages.yml --limit 5
gh run view <run-id> --log
gh api repos/Hotzh3/doom-bin-bash-edition/pages
```

## What to show in presentation

- GitHub Actions run for `Deploy GitHub Pages`.
- Successful `upload-pages-artifact` step.
- Successful `deploy-pages` step.
- The live Pages URL loaded in a browser.
- `dist/runtime-manifest.json` in the build artifact for traceability.

## If it fails

Check in this order:

1. Pages source is set to GitHub Actions.
2. Repository Actions permissions allow Pages deployment.
3. `npm run build` completed successfully.
4. `dist/` was uploaded by `upload-pages-artifact`.
5. Vite asset paths use `/doom-bin-bash-edition/`.
6. The deployment environment is named `github-pages`.
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
