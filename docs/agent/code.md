# Código: convenciones generales

Leé esta guía antes de escribir o revisar código en cualquier parte del repo. Lo específico del dominio está en [`scene.md`](./scene.md).

Estas reglas salen de lo que ya hace la mayor parte del repo. Si encontrás código que no las sigue, no lo corrijas de paso: respetá la regla en lo que escribís y avisá.

## Idioma

| Qué                                                         | Idioma  |
| ----------------------------------------------------------- | ------- |
| Identificadores, nombres de archivos y carpetas             | Inglés  |
| Comentarios, JSDoc y comentarios de markup (`<!-- … -->`)   | Español |
| Títulos de `describe` / `it`                                | Español |
| Mensajes de `Error`                                         | Español |

Las rutas y los nombres de assets que forman parte de una URL van en español, porque los lee el visitante: `/terminos`, `static/casos/`, `static/figures/como-trabajamos-1.webp`.

## Archivos y estructura

- **Nombres en kebab-case:** `case-card.svelte`, `deck-logic.ts`. Los componentes se importan en PascalCase, pero el archivo queda en kebab-case.
- **Sufijos:**
  - `*.test.ts`: tests;
  - `*.svelte.ts`: módulos con runas (estado reactivo);
  - `*.frag.glsl` y `*.vert.glsl`: shaders; `*.glsl` a secas, GLSL compartido.
- **Lógica pura junto al componente:** `edge-warp.svelte` dibuja y `edge-warp.ts` calcula, con el mismo nombre.
- **Tests junto al módulo que prueban** (`layout.ts` y `layout.test.ts`). Vitest toma `src/**/*.test.ts`.

## Imports

- **Extensión `.js` en imports relativos de TypeScript** (`from './layout.js'`), y `.svelte.js` para los módulos con runas (`from './deck.svelte.js'`).
- **Dentro de una carpeta, ruta relativa; entre carpetas, el alias `$lib`** (`from '$lib/tokens.js'`).
- **Tipos:** con `import type` o con `type` inline (`import { x, type Y }`). Con `verbatimModuleSyntax` (lo activa SvelteKit), un tipo importado sin `type` rompe el build.

## Declaraciones y tipos

- **Exports con nombre.** `export default` solo donde el framework o la herramienta lo exige (archivos de configuración, declaraciones de módulos como `glsl.d.ts`).
- **`type` para formas de datos.** **`interface`** para `Props` de componentes.
- **Sin `enum`.** Usá uniones de strings (`'cover' | 'contain'`).
- **Constantes de módulo en `UPPER_SNAKE_CASE`,** con `as const` cuando son un objeto de valores (`PALETTE`, `CASE_LOOK`).
- **Clases solo para estado con runas** (`*.svelte.ts`); funciones puras para todo lo demás.
- **Prohibido:** `any`, `@ts-ignore` y `@ts-expect-error` sin un comentario que explique por qué. El non-null `!` solo en tests. El `tsconfig` tiene `strict` y `noUncheckedIndexedAccess`: un acceso por índice puede ser `undefined`.

## Nombres

- Variables y funciones en camelCase; tipos, clases y componentes en PascalCase.
- **Unidades en el JSDoc** cuando no son obvias (píxeles CSS o físicos, segundos, milisegundos, rad/s).

## Comentarios

- **En español, explicando el porqué:** invariantes, decisiones no obvias, limitaciones de una librería y excepciones a una regla. No describas lo que el código ya dice.
- **JSDoc en lo exportado y en las constantes:** qué es, su unidad y de dónde sale el valor si lo eligió el usuario.
- **Si te apartás de una regla a propósito,** dejá un comentario con el motivo.
- **Sin `TODO` ni `FIXME` en el código,** con una excepción: los placeholders de contenido en `src/lib/content.ts` se marcan con `TODO` hasta tener el dato real.

## Tests

- **Runner:** Vitest con `describe` / `it` / `expect`, importados explícitamente.
- **La lógica testeable vive fuera del componente:** en funciones puras, y el componente solo orquesta.
- **Títulos:** `describe('sceneFrame')`, `it('centra en el área lo que entra')`.
- **Qué cubrir:** los casos de borde del layout (lo que entra y lo que no, teléfono y escritorio), los defaults, y todo bug corregido.

## Formato

- **Estilo:** 2 espacios, comillas simples, sin punto y coma, trailing comma en literales multilínea. Respetalo en lo que escribas.
- **Formateador:** no hay ninguno configurado. No corras ninguno sobre archivos existentes: sumar una configuración de formato es configuración compartida, preguntá antes.
- **No mezcles formato con lógica** en un mismo commit.
