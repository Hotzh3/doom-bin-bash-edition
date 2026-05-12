# Release Flow

## Objetivo

Mantener un pipeline de entrega simple y profesional para un frontend game estático:

- `CI` valida calidad.
- `CD` publica preview en GitHub Pages.
- `release.yml` genera artifacts descargables en cada build y crea GitHub Releases cuando se corta un tag.

## CI vs CD

### CI

Workflow: `.github/workflows/ci.yml`

Responsabilidad:

- instalar dependencias
- ejecutar `test`
- ejecutar `lint`
- ejecutar `build`
- correr `npm audit --audit-level=high`

CI responde la pregunta: "¿este cambio sigue siendo sano para mergearse?"

### CD / Release

Workflows:

- `.github/workflows/cd-pages.yml`
- `.github/workflows/release.yml`

Responsabilidad:

- construir artifacts descargables
- publicar preview estático en GitHub Pages sobre `main`
- crear releases versionadas cuando llega un tag

CD responde la pregunta: "¿qué build entregable salió de este commit?"

## Estrategia de release

### `main`

Cada push a `main`:

- ejecuta `release.yml`
- genera `dist/`
- genera un `.zip` del build
- sube ambos como artifacts del workflow
- mantiene el deploy preview/live en GitHub Pages vía `cd-pages.yml`

Esto da trazabilidad simple para portfolio y permite descargar el build exacto de cada commit principal.

### Tags

Cada tag `v*`:

- ejecuta `release.yml`
- vuelve a validar `test`, `lint`, `build`
- empaqueta `dist/` en un zip versionado
- crea un GitHub Release automático
- adjunta el zip al release
- genera release notes básicas automáticas con GitHub

## Semantic versioning básico

Formato recomendado:

- `v0.1.0`
- `v0.2.0`
- `v0.2.1`

Regla simple:

- `MAJOR`: cambios incompatibles o reposicionamiento fuerte del proyecto
- `MINOR`: features nuevas compatibles
- `PATCH`: fixes, polish, balance o correcciones sin romper flujo

Para un portfolio game, este nivel de semver es suficiente y evita sobreingeniería.

## Cómo cortar releases

### 1. Preparar estado

Verifica localmente:

```bash
npm ci
npm run test
npm run lint
npm run build
```

### 2. Mergear a `main`

El push a `main` disparará:

- preview artifact en GitHub Actions
- deploy en GitHub Pages

### 3. Crear tag

Ejemplo:

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 4. Resultado esperado

En GitHub:

- correrá `release.yml`
- aparecerán artifacts descargables en la run
- se creará un GitHub Release con notas automáticas
- el asset zip quedará adjunto al release

## Artifacts generados

En `release.yml`:

- `preview-dist-main-<sha7>` en pushes a `main`
- `preview-zip-main-<sha7>` en pushes a `main`
- `release-dist-vX.Y.Z` en tags
- `release-zip-vX.Y.Z` en tags

## Trigger summary

- `push` a `main`
- `push` de tags `v*`
- `workflow_dispatch`

## Notas operativas

- GitHub Pages sigue siendo el preview/deploy estático más simple para este repo.
- El release asset usa el build estándar con base path `/`, útil para descargar y servir en cualquier host estático.
- El deploy de Pages mantiene su propio build con `BASE_PATH=/<repo>/`, porque GitHub Pages no vive en la raíz del dominio del proyecto.
