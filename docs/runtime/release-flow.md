# Release Flow

## Objetivo

Mantener un pipeline de entrega simple y profesional para un frontend game estático:

- `CI` valida calidad.
- `CD` publica preview en GitHub Pages.
- `release.yml` genera artifacts descargables cuando se corta un tag de versión o cuando se dispara manualmente.

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

- construir artifacts descargables bajo demanda
- publicar preview estático en GitHub Pages sobre `main`
- crear releases versionadas cuando llega un tag

CD responde la pregunta: "¿qué build entregable salió de esta versión o ejecución manual?"

## Estrategia de release

### `main`

Cada push a `main`:

- ejecuta CI
- mantiene el deploy preview/live en GitHub Pages vía `cd-pages.yml`

No ejecuta `release.yml`. Esto evita que el badge de Release se vuelva rojo por builds de main que no representan una versión publicada.

### Tags

Cada tag `v*.*.*`:

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

- `release-dist-vX.Y.Z` en tags
- `release-zip-vX.Y.Z` en tags
- `manual-dist-manual-<sha7>` en `workflow_dispatch`
- `manual-zip-manual-<sha7>` en `workflow_dispatch`

## Trigger summary

- `push` de tags `v*.*.*`
- `workflow_dispatch`

## Notas operativas

- GitHub Pages sigue siendo el preview/deploy estático más simple para este repo.
- El release asset usa el build estándar con base path `/`, útil para descargar y servir en cualquier host estático.
- El deploy de Pages mantiene su propio build con `BASE_PATH=/<repo>/`, porque GitHub Pages no vive en la raíz del dominio del proyecto.
