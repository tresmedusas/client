# Escena: capas, diseño, contenido y performance

Leé esta guía antes de tocar `src/routes`, `src/lib/scene` o cualquier módulo de `src/lib` que la escena o las páginas usen. Las reglas visuales están en [`DESIGN.md`](../../DESIGN.md) y el recorrido del sitio en el [`README.md`](../../README.md#cómo-funciona); acá están solo las reglas que el código tiene que cumplir.

## Capas

```
src/routes      → páginas: el HTML semántico prerenderizado, una <section> por escena
      │ depende de
      ▼
src/lib/scene   → la escena WebGL: stage, deck, componentes, figuras y shaders
      │ depende de
      ▼
src/lib         → content.ts, tokens.ts y lógica pura compartida (lead-in, inline-headline)
      │ depende de
      ▼
essentia-*      → vidrio, texto SDF y primitivas
```

- **Dependencia unidireccional:** una capa importa solo de las de abajo. `src/lib/scene` no importa de `src/routes`, y `tokens.ts` no importa nada: `+layout.svelte` lo publica como variables CSS para el primer paint, y three no puede entrar a ese JS.
- **Dónde va cada cosa:** textos, links y datos, en `content.ts`; colores, fuentes y medidas de identidad, en `tokens.ts`; posiciones y tamaños de una escena, en `scene/layout.ts`; lo que solo existe con WebGL, en `scene/`.
- **La escena entra con `import()` dinámico** desde `+layout.svelte` (`scene/stage.svelte`). Una ruta puede importar de `scene/` un módulo puro (`scene/headline.ts`), pero nunca un componente ni nada que importe three, Threlte o Essentia: entrarían al primer JS.
- **Mover algo de capa es decisión del usuario** (ver `CLAUDE.md`).

## Dos capas, un contenido

- **Toda escena tiene su par semántico:** una `<section>` en la ruta, con el mismo contenido y los links reales. Es lo que leen los buscadores y los lectores de pantalla, lo que recorre Tab y lo que se ve sin WebGL 2 (con `src/app.css`).
- **Un componente nuevo se hace en las dos capas** en el mismo cambio. Los que existen en las dos comparten nombre: `scene/inline-headline.svelte` y `inline-headline.svelte`, `scene/hero-figure.svelte` y `hero-figure.svelte`.
- **El contenido sale de `content.ts`** en las dos. Lo marcado ahí con `TODO` es provisorio: no lo completes inventando.

## Diseño

Antes de crear o cambiar un componente visual, leé `DESIGN.md` y cumplí su checklist. En particular:

- **Alineación:** centrado por convención. Otra alineación solo si el usuario la pide para ese componente; anotá la excepción en la sección 6 de `DESIGN.md`.
- **Títulos:** como el titular del hero (texto en `muted` 400, lo destacado con `**…**` en `ink` 900). En la escena, con `scene/inline-headline.svelte`; en la capa semántica, con `inline-headline.svelte`.
- **Párrafos:** con lead-in. En la escena, `scene/lead-in-text.svelte`; en la capa semántica, `lead-in.svelte`.
- **Figuras e imágenes:** estética Linear, con los tokens `FIGURE` de `tokens.ts`.
- **Colores y fuentes:** de `tokens.ts`, nunca de hex sueltos. No hay color de marca: no introduzcas ninguno.
- **Una decisión nueva que aplica a más de un componente** se agrega a `DESIGN.md` en el mismo cambio. Las excepciones pedidas por el usuario se anotan ahí con la fecha.

## Patrones

| Parte               | Dónde                 | Responsabilidad                                                              |
| ------------------- | --------------------- | ---------------------------------------------------------------------------- |
| Componente          | `x.svelte`            | Orquesta: lee props y estado, y dibuja                                       |
| Lógica pura         | `x.ts`                | Cálculo testeable sin renderizar (layout, física del deck, parseo de texto)  |
| Estado reactivo     | `x.svelte.ts`         | Runas (`$state`, `$derived`) y lo que necesita el ciclo de vida de Svelte    |
| Tests               | `x.test.ts`           | Junto al módulo que prueban                                                  |
| Shaders             | `x.frag.glsl`, `x.vert.glsl` | GLSL propio de la escena; lo compartido, en un `.glsl` que se incluye  |
| Look                | constante `X_LOOK`    | Los valores ajustables de un efecto, en un solo objeto (`PRISM_LOOK`, `CASE_LOOK`, `SHOWCASE_WARP`) |

Referencia: el deck, en `scene/deck-logic.ts` (puro), `scene/deck.svelte.ts` (estado) y `scene/deck-logic.test.ts`.

- **Lógica testeable fuera del componente:** si un cálculo se puede probar sin canvas, va en el `.ts` puro.
- **Los valores de un look salen del banco de pruebas** (`src/lib/lab/`): el usuario los ajusta en vivo y pega el resultado en el archivo del look. No los cambies por tu cuenta.

## Performance

- **Si una decisión tiene costo de performance,** cuantificalo al proponerla: frames que se redibujan, capturas de vidrio, render targets, peso del primer JS.
- **En reposo no se redibuja:** fuera del hero, la escena se redibuja solo durante una transición. Una animación propia corre solo mientras su escena se ve, y nunca con `prefers-reduced-motion` ni con la pestaña oculta.
- **Dos niveles de captura de vidrio:** el contenido (z 1) y la navbar (z 10). Un nivel nuevo es una captura más por frame: proponelo antes.

## Lo que nunca se hace

- Un texto, un link o un color escritos a mano en un componente.
- Una escena sin su `<section>` semántica, o con contenido distinto al de la escena.
- Un import estático desde una ruta de un componente de `scene/`, o de un módulo que importe three, Threlte o Essentia.
- Código de `src/lib/lab/` usado desde el sitio fuera de `npm run dev`.

## Demos y verificación

- **Verificación:** `npm run dev` (la preview `landing`) y revisá en el navegador la escena afectada y las páginas que usan el mismo componente (`/`, `/showcase`, `/showcase/{id}`, `/terminos`).
- **Probá también:** ancho de teléfono (una escena que no entra scrollea adentro), teclado (Tab recorre los links del HTML y la escena dibuja el foco) y movimiento reducido.
- **La capa semántica** se revisa en el HTML del build (`npm run build` y la preview `landing-build`).
