---
name: release
description: Release de develop a main en Tres Medusas. Corre la Definition of Done sobre la punta de develop, abre el PR de release a main con todo lo que entra y lo mergea cuando el check de Vercel está en verde.
disable-model-invocation: true
---

# Release de `develop` a `main`

Invocar `/release` autoriza el push y el merge del PR de release a `main`, y con eso que Vercel tome el merge. Nada más: ni force push, ni `--admin`, ni deployar a mano, ni commitear en `develop` o `main`. Las reglas de fondo están en [`docs/agent/git.md`](../../../docs/agent/git.md). Si esa guía cambia, manda ella.

Si el usuario pasa argumentos, son correcciones al plan (`sin #36`, `título: Contact page`). Aplicalas por encima de lo que deduzcas.

El paquete es privado y no se versiona: no hay bumps, CHANGELOG ni publicación a npm ([`git.md`](../../../docs/agent/git.md#deploy)).

## 1. Ver qué sale

```bash
git fetch origin --prune
git log --oneline --first-parent origin/main..origin/develop
git diff --stat origin/main origin/develop
gh pr list --state open
```

`--first-parent` deja una línea por PR mergeado a `develop`: esos son los PRs del release.

Frená y avisá si:

- `origin/main..origin/develop` está vacío: no hay nada para sacar.
- Hay commits directos en `develop` que no vienen de un PR: el release los lleva sin revisión, preguntá antes de seguir.
- Hay un PR abierto contra `develop` que parece parte del release: preguntá si esperarlo.
- Ya hay un PR abierto de `develop` a `main`: no abras otro; preguntá si seguís con ese.

## 2. Verificar la punta de `develop`

Verificá lo que va a llegar a `main`, no `HEAD`: la sesión puede estar parada en otra rama.

```bash
git switch --detach origin/develop
```

Si el árbol tiene cambios sin commitear, frená y preguntá antes de cambiar de commit.

Después, la Definition of Done de `AGENTS.md`, en el orden de [`environment.md`](../../../docs/agent/environment.md#verificación-local):

```bash
npm ci
```

```bash
npm test
```

```bash
npm run check
```

```bash
npm run build
```

`npm run check` tiene que dar 0 errores. Anotá los números (tests y archivos, errores y warnings) para el PR. Si algo falla, frená y mostrá el error: un release no arregla código.

Con el build listo, levantá la preview `landing-build` y mirá cada página que tocaron los PRs del release, en escritorio y en ancho de teléfono, más la capa semántica. Es un repaso, no una revisión de diseño: si algo se ve roto, frená y mostralo.

## 3. PR de release

```bash
gh pr create --base main --head develop --title "Release: <temas>"
```

- **Título:** `Release:` y los temas en inglés, como `Release: hero test bench, figure plate, rounded glass sheets and agent conventions`.
- **Resumen:** «Release de `develop` a `main`. Incluye los PRs …» y un punto por cambio relevante con su `tipo(área)`, citando cada PR. Leé los PRs (`gh pr view <n>`) en vez de resumir commits, porque ahí están lo verificado y lo pendiente.
- **Verificación:** lo que corriste en el paso 2 con sus números, sobre qué commit, y qué miraste en la preview (escritorio, teléfono, capa semántica). Si no miraste algo, decilo.
- **Pendiente (fuera de este PR):** juntá lo que los PRs dejaron abierto y siga vigente, más lo que el paso 2 no cubrió.

## 4. Esperar el check y mergear

El único check es el deploy de preview de `Vercel`. Si la sesión tiene `mcp__ccd_pr__get_status`, leé el estado de ahí. Si no, bloqueá con:

```bash
gh pr checks <n> --watch
```

Mergeá solo con el check en verde y el PR sin conflictos, con merge commit:

```bash
gh pr merge <n> --merge
```

Nunca uses `--delete-branch`: la rama de origen es `develop`. Si el check falla o el PR queda con conflictos, frená y mostrá el error: no reintentes con `--admin` ni arregles código dentro de este flujo.

## Al terminar

`gh pr merge` no imprime nada cuando sale bien. Confirmá el resultado:

```bash
gh pr view <n> --json state,mergeCommit
```

```bash
git fetch origin && git log --oneline -3 origin/main
```

Volvé a la rama en la que estaba la sesión (`git switch -`). El deploy del merge lo hace Vercel con su integración de GitHub: no lo dispares a mano. Si el merge commit ya tiene su status, mostralo:

```bash
gh api repos/{owner}/{repo}/commits/<sha>/status --jq '.statuses[] | "\(.context): \(.state) \(.target_url)"'
```

Reportá: el link al PR, el merge commit, el estado del deploy de Vercel si ya está, y lo que quedó pendiente.
