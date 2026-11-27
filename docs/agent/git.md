# Git: ramas, commits, PRs y deploy

Leé esta guía antes de crear una rama, commitear o abrir un PR.

## Ramas

- **`main`** es la rama estable y **`develop`** la de integración. Ninguna de las dos recibe commits directos.
- **Las ramas de trabajo salen de `develop`** y se llaman `<tipo>/<descripcion-en-kebab-case>`, en inglés (`feat/case-page`, `fix/showcase-scene-bottom`). El `<tipo>` es el mismo que el de los commits. Las ramas `claude/<descripcion>` que crea Claude Code al abrir un worktree también valen.
- **Flujo:** rama de trabajo → PR a `develop` → PR de `develop` a `main`.
- **El PR de `develop` a `main` es un release:** revisá qué incluye antes de pedir el merge.
- **Nunca** hagas force push a `main` ni a `develop`. En tu propia rama, solo si nadie más trabaja sobre ella.

## Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/es/):

```text
<tipo>(<área>): <descripción>

<cuerpo opcional: por qué se hizo el cambio>
```

- **Descripción:** en inglés, imperativo, minúscula y sin punto final (`fix(showcase): start at the case card when coming back`).
- **Tipos:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci` y `chore`.
- **Área:** la sección o el módulo afectado: `hero`, `how-work`, `about`, `contact`, `showcase`, `case`, `nav`, `footer`, `terms`, `deck`, `content`, `tokens`, `lab`. Se omite si el cambio es transversal.
- **Un cambio lógico por commit.** Nada de `wip` ni "cambios menores": si hace falta, reescribí el historial de tu rama antes del PR.
- **No mezcles formato con lógica.**

El historial anterior a esta guía está en español y sin tipo: no lo reescribas (ver [`traps.md`](./traps.md#convenciones-con-contradicciones-heredadas)).

## Pull requests

- **Título:** mismo formato que un commit, o un resumen corto si el PR agrupa varios commits.
- **Descripción en español,** con estas secciones:
  - **Resumen:** qué cambia y por qué, un punto por commit relevante (con su `tipo(área)`);
  - **Verificación:** comandos de la Definition of Done que corriste y su resultado (tests que pasan, diagnósticos de `npm run check`, lo que revisaste en el navegador);
  - **Pendiente (fuera de este PR):** lo que encontraste y no resolviste.
- **Capturas** si cambia algo visual.
- **Base del PR:** `develop`. Solo el PR de release apunta a `main`.
- **Un tema por PR,** chico y revisable. Los refactors y reformateos van en PRs separados.
- **Verificación:** no hay CI, así que la Definition of Done de `AGENTS.md` se corre en local antes de pedir el merge. Qué correr, en [`environment.md`](./environment.md#verificación-local).
- **Merge:** con merge commit.

## Deploy

- **Qué se deploya:** `npm run build` deja el sitio estático en `build/`, que sirve cualquier hosting estático. El repo no tiene configuración de hosting ni un workflow que deploye.
- **El paquete es privado** (`"private": true`) y no se versiona: no hay bumps ni CHANGELOG.
- **Un agente no deploya** ni configura un hosting sin un pedido explícito.
