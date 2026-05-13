# Deployment

## Deployment model

This project deploys as a static browser app.

- Local development uses the Vite dev server.
- Production output is generated into `dist/`.
- GitHub Pages is the static CD target for the playable browser demo.
- GitHub Releases can attach the same static build as a downloadable artifact.

## GitHub Pages target

Expected public URL:

```text
https://Hotzh3.github.io/doom-bin-bash-edition/
```

The app is served under the repository path, so the Pages build must use:

```text
BASE_PATH=/doom-bin-bash-edition/
```

`vite.config.ts` reads `BASE_PATH` and falls back to `/` for local development,
Docker, and normal local builds.

## Required GitHub setting

GitHub Pages must be enabled once in repository settings:

1. Open `Settings -> Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.
3. Save the setting.

No custom secrets are required.

## CD workflow

Workflow: `.github/workflows/cd-pages.yml`

Triggers:

- push to `main`
- `workflow_dispatch`

Flow:

1. checkout
2. setup Node 20
3. configure Pages
4. `npm ci`
5. `npm run test`
6. `npm run lint`
7. `BASE_PATH=/<repo-name>/ npm run build`
8. upload `dist/` with `actions/upload-pages-artifact`
9. deploy with `actions/deploy-pages`

## Local Pages validation

Build with the same base path used by Pages:

```bash
npm run pages:build
```

Then inspect `dist/index.html`. Asset URLs should start with:

```text
/doom-bin-bash-edition/assets/
```

Optional preview:

```bash
npm run pages:preview
```

Open:

```text
http://localhost:4173/doom-bin-bash-edition/
```

## Remote verification

If GitHub CLI is authenticated:

```bash
gh run list --workflow cd-pages.yml --limit 5
gh run view <run-id> --log
gh api repos/Hotzh3/doom-bin-bash-edition/pages
```

Also verify the browser URL:

```text
https://Hotzh3.github.io/doom-bin-bash-edition/
```

## If Pages fails

Check these first:

- `Settings -> Pages -> Source` is set to `GitHub Actions`.
- Workflow permissions include `contents: read`, `pages: write`, and `id-token: write`.
- The workflow has environment `github-pages`.
- `dist/` exists before `upload-pages-artifact`.
- `dist/index.html` uses `/doom-bin-bash-edition/assets/...` asset paths.
- The failing GitHub Actions log does not show `npm ci`, test, lint, or build errors.

## Current limitations

- This deploy is static frontend only.
- There is no backend/API deployment in the current scope.
- Remote Pages success must be confirmed in GitHub Actions after the branch is merged or the workflow is manually dispatched.
