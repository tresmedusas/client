# Entorno, dependencias y configuración compartida

Leé esta guía antes de tocar dependencias, la versión de Node o la configuración del build.

## Toolchain

- **Node:** `.nvmrc` pide 24 y `engines` acepta `>=24`. Usá `nvm use` (o `fnm use`) en la raíz.
- **Gestor de paquetes:** npm, con `package-lock.json`. No uses otro.
- **Cambiar de versión** de Node es configuración compartida: preguntá antes y actualizá `.nvmrc` y `engines` juntos.

## Dependencias

- **Lockfile:** uno solo, `package-lock.json`.
- **Agregar una dependencia:** `npm install <paquete>` (`-D` si solo se usa en el build o en los tests). Una dependencia nueva es decisión del usuario (ver `CLAUDE.md`).
- **Registry público:** toda entrada del lockfile resuelve desde el registry público. Si aparece una URL de un registry privado, corregila antes de commitear.
- **Nunca uses `--force` ni `--legacy-peer-deps`** para tapar un conflicto de peers: resolvelo o dejá la versión anterior y anotalo en [`traps.md`](./traps.md).
- **Una sola copia de los peers de Essentia:** `svelte`, `three`, `@threlte/core` y `@threlte/extras` están en `resolve.dedupe` de `vite.config.ts`. Dos copias rompen `instanceof` y el contexto de Threlte. Si sumás un paquete que trae alguno como peer, revisá que el lockfile siga con una sola.
- **Essentia se actualiza en conjunto:** al subir `essentia-core`, `essentia-primitives`, `essentia-crystal` o `essentia-ui`, revisá que el lockfile siga con una sola copia de cada uno y volvé a mirar la escena: un cambio de default en un preset de vidrio se ve.
- **`@types/three` sigue a `three`:** misma versión menor.

## Build

- **Todo se prerenderiza:** `src/routes/+layout.ts` exporta `prerender = true` y el adapter es `adapter-static`. Una ruta nueva tiene que poder renderizarse en el build, sin `window` ni WebGL.
- **Shaders:** `vite-plugin-glsl` importa los `.glsl` de `src/` como strings (tipos en `src/glsl.d.ts`). Los de Essentia ya vienen como módulos JS.
- **Salida:** `build/`, fuera de git.

## Scripts

- `npm run dev`: servidor de desarrollo, con los bancos de pruebas de `src/lib/lab/`.
- `npm run build`: sitio estático en `build/`.
- `npm run preview`: sirve `build/`.
- `npm run check`: `svelte-kit sync` y `svelte-check`.
- `npm test`: `vitest run`.
- **Servidores desde Claude Code:** con la preview de `.claude/launch.json` (`landing` en el puerto 5180, `landing-build` en el 4180), no con `npm run dev` en una terminal.

## Verificación local

No hay CI. Antes de abrir un PR corré, en este orden:

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

- **`npm run check` tiene que dar 0 errores.** Los warnings no frenan, pero no sumes nuevos.
- **Sumar una CI** (un workflow en `.github/workflows/`) es configuración compartida: proponelo antes.

## Configuración compartida

Cualquier cambio en `package.json`, `package-lock.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.nvmrc`, `.gitignore` o `.claude/launch.json` se propone antes (ver `CLAUDE.md`).

## Assets

- **Qué está en `.gitignore`:** `node_modules`, `.svelte-kit`, `build` y los `.env` (menos `.env.example`).
- **Dónde va cada asset:** todo en `static/`: fuentes en `fonts/`, logo en `brand/`, íconos en `icons/`, figuras en `figures/`, previsualizaciones de los casos en `casos/` y fotos en `founders/`.
- **Imágenes:** comprimilas al tamaño de uso antes de commitear. Las figuras estáticas van en SVG; las exportadas de la escena, en WebP con fondo transparente (formato en `DESIGN.md`, sección 4).
- **Videos:** todavía no hay. Antes de sumar uno, preguntá dónde se aloja: no va en el repo.
