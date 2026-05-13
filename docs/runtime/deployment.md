# Deployment

## Deployment model

This project deploys as a static browser app.

- Local development: Vite dev server.
- CI build output: `dist/`.
- Preview/live static deploy: GitHub Pages (`cd-pages.yml`).
- Versioned downloadable bundle: GitHub Releases (`release.yml` on tags).

## CI vs CD in deployment terms

- **CI (`ci.yml`)** validates code quality and buildability.
- **CD Pages (`cd-pages.yml`)** publishes static build to GitHub Pages.
- **Release (`release.yml`)** creates downloadable release artifacts and GitHub Releases for tags.

## Build outputs

Primary output:

```text
dist/
  index.html
  assets/
  runtime-manifest.json
```

`runtime-manifest.json` provides traceability (version/sha/channel metadata).

## GitHub Pages requirements

Pages deploy requires one-time repository configuration:

1. GitHub repo -> `Settings` -> `Pages`
2. Source: **GitHub Actions**

No custom secrets are required for this repo's Pages flow.

## Base path behavior

- Release/static-host default: `BASE_PATH=/`
- Pages workflow: `BASE_PATH=/<repo-name>/`

This prevents broken asset URLs when serving under `https://<org>.github.io/<repo>/`.

## Recommended release path

1. Open PR -> CI validates (`test/lint/build`).
2. Merge to `main` -> CI + Pages deploy + release artifacts on main run.
3. Tag release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

4. `release.yml` creates GitHub Release and attaches zip.

## Where to verify results

- CI and CD runs: repository `Actions` tab.
- Pages URL: workflow deployment summary (`deploy-pages` step output).
- Artifacts: each workflow run under `Artifacts`.
- Release zip: repository `Releases` page.

## If deployment fails

1. Check failing job logs in `Actions`.
2. Validate locally:

```bash
npm ci
npm run test
npm run lint
npm run build
```

3. Re-push fixes.
4. Re-run workflow if needed.

## Current limitations

- No backend/API deploy (intentionally out of scope).
- No environment-specific secret management needed in current flow.
- No canary or multi-environment release promotion; this is a single static delivery path suitable for portfolio scale.
