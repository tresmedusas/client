# AGENTS.md

Fuente única de verdad para cualquier agente que trabaje en este repo. El detalle por área está en [`docs/agent/`](docs/agent). La documentación para personas ([`README.md`](README.md), [`DESIGN.md`](DESIGN.md)) sigue donde está: las guías de agente la enlazan, no la copian.

## Proyecto

Tres Medusas — landing es el sitio de Tres Medusas, hecho con [Essentia](https://github.com/urielri/essentia). Lo que se ve se dibuja en la GPU (vidrio, papel, texto SDF), y el HTML prerenderizado queda para SEO, accesibilidad y como versión sin WebGL: toda escena tiene su par semántico y las dos leen el mismo contenido. No hay roadmap: lo pendiente está en los `TODO` de [`src/lib/content.ts`](src/lib/content.ts) y en las decisiones abiertas de `DESIGN.md` (la identidad todavía no tiene color de marca).

## Stack

- **Repo:** un solo paquete privado (`tres-medusas`), npm con `package-lock.json`, Node 24 (`.nvmrc`).
- **Aplicación:** SvelteKit 2 con `adapter-static` (todo prerenderizado), Svelte 5, Threlte 8, three 0.186 y Essentia (`essentia-core`, `essentia-primitives`, `essentia-crystal`, `essentia-ui`). Shaders propios con `vite-plugin-glsl`.
- **Tests:** Vitest (`src/**/*.test.ts`).
- **Versionado:** no se publica ni se versiona; `build/` es un sitio estático que deploya Vercel (ver [`docs/agent/git.md`](docs/agent/git.md#deploy)).

## Comandos

```bash
npm install                            # instalar
npm test                               # todos los tests (vitest run)
npm run check                          # chequeo de tipos (svelte-check)
npm run build                          # sitio estático en build/
npx vitest run src/lib/scene/layout    # un archivo de tests
npm run dev                            # servidor de desarrollo
```

No hay CI de tests ni de tipos (el único check de un PR es el deploy de preview de Vercel): la verificación es local (ver [`docs/agent/environment.md`](docs/agent/environment.md#verificación-local)). Para ver el sitio desde Claude Code, la preview es `landing` en [`.claude/launch.json`](.claude/launch.json) (`landing-build` sirve el build).

## Reglas transversales

- **Capas:** `src/routes` → `src/lib/scene` → `src/lib` (contenido, tokens, lógica pura) → Essentia, nunca al revés. Detalle en [`docs/agent/scene.md`](docs/agent/scene.md).
- **Dos capas, un contenido:** todo lo que se dibuja en la escena tiene su versión en el HTML semántico, y las dos leen de `src/lib/content.ts`. Un texto o un link escrito a mano en un componente es un bug.
- **Diseño:** antes de crear o cambiar un componente visual, leé [`DESIGN.md`](DESIGN.md) y cumplí su checklist. Colores y fuentes salen siempre de [`src/lib/tokens.ts`](src/lib/tokens.ts), nunca de hex sueltos.
- **Centrado por convención:** el contenido de todo componente va centrado. Otra alineación solo si el usuario la pide para ese componente, y se anota en la sección 6 de `DESIGN.md`.
- **Lo que es de Essentia va a Essentia:** vidrio, texto y primitivas se usan desde los paquetes `essentia-*`. Si falta algo ahí, se propone; no se reimplementa acá.
- **Dependencias:** un solo lockfile; nunca `--force` ni `--legacy-peer-deps`. Toda dependencia se resuelve desde el registry público.
- **Bancos de pruebas:** `src/lib/lab/` es una herramienta de trabajo que solo aparece con `npm run dev`. No entra al build ni sigue las reglas de diseño, y no se usa como referencia de un componente.

## Antes de tocar un área, leé su guía

| Si vas a tocar…                                                             | Leé                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| Cualquier código (nombres, imports, tipos, comentarios, tests)              | [`docs/agent/code.md`](docs/agent/code.md)               |
| La escena, la capa semántica, el contenido o cualquier cosa que se ve       | [`docs/agent/scene.md`](docs/agent/scene.md) y [`DESIGN.md`](DESIGN.md) |
| Ramas, commits, PRs o deploy                                                | [`docs/agent/git.md`](docs/agent/git.md)                 |
| Dependencias, toolchain, configuración compartida                           | [`docs/agent/environment.md`](docs/agent/environment.md) |
| Algo que no funciona como esperabas                                         | [`docs/agent/traps.md`](docs/agent/traps.md)             |

## Definition of Done

1. **Tests:** `npm test`.
2. **Tipos:** `npm run check`. Tiene que dar 0 errores. Los warnings preexistentes no frenan, pero no sumes nuevos.
3. **Build:** `npm run build`. El sitio se prerenderiza, así que un error de SSR aparece recién acá.
4. **Verificación visual:** si cambió algo que se ve, probalo en la preview `landing`, en escritorio y en ancho de teléfono, y revisá también la capa semántica (lo que se ve sin WebGL).
5. **Docs al día:**
   - cambió una regla → la guía de `docs/agent/` correspondiente;
   - una decisión de diseño nueva aplica a más de un componente, o es una excepción pedida por el usuario → `DESIGN.md`, en el mismo cambio;
   - cambió dónde vive algo → la tabla "Dónde se cambia cada cosa" del `README.md`.
