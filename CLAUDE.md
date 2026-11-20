# Tres Medusas — landing

Sitio de Tres Medusas hecho con Essentia (Svelte 5 + Threlte + three). Se habla en español.

## Diseño

Antes de crear o cambiar cualquier componente visual, lee [DESIGN.md](DESIGN.md) y cumple su checklist. En particular:

- **Alineación:** el contenido de todo componente va centrado por convención. Alinearlo distinto solo si el usuario lo pide explícitamente para ese componente; anota la excepción en la sección 6 de DESIGN.md.
- **Títulos y párrafos:** usan lead-in. En la escena va con `src/lib/scene/lead-in-text.svelte`; en la capa semántica, con `src/lib/lead-in.svelte`.
- **Figuras e imágenes:** siguen la estética Linear de DESIGN.md, con los tokens `FIGURE` de `src/lib/tokens.ts`.
- **Colores y fuentes:** salen siempre de `src/lib/tokens.ts`, nunca de hex sueltos.

Si una decisión de diseño nueva aplica a más de un componente, agrégala a DESIGN.md en el mismo cambio.

## Verificación

`npx svelte-check`, `npx vitest run` y `npm run build`. La preview es "landing" en `.claude/launch.json`.
