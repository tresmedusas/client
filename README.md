# Tres Medusas — landing

Landing inicial de Tres Medusas, hecha con [Essentia](https://github.com/urielri/essentia) (Svelte 5 + Threlte + three.js): lo que se ve se dibuja en la GPU (vidrio, fondo de papel con grano, texto SDF) y el HTML prerenderizado queda para SEO, accesibilidad y como versión sin WebGL.

## Desarrollo

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run build` deja el sitio estático en `build/` (adapter-static): se publica en cualquier hosting estático (Vercel, Netlify, Cloudflare Pages). `npm test` corre los tests del layout y `npm run check` el chequeo de tipos.

## Dónde se cambia cada cosa

| Qué | Dónde |
| --- | --- |
| Textos, links, correo, LinkedIn, Calendly, equipo y proyectos | `src/lib/content.ts` (única fuente: la usan el HTML y el canvas; los placeholders están marcados con TODO) |
| Colores, fuentes y logo | `src/lib/tokens.ts`; fuentes (Lato) en `static/fonts/`, logo en `static/brand/` |
| Fondo: papel con grano, bruma, estela de las transiciones, tentáculos | `src/lib/scene/backdrop.frag.glsl` |
| Comportamiento de las escenas (rueda, arrastre, teclado) | `src/lib/scene/deck.svelte.ts` y `deck-logic.ts` |
| Posición y tamaño de las medusas | `medusas()` en `src/lib/scene/layout.ts` |
| Estilo sin WebGL | `src/app.css` |

## Páginas

- `/`: Hero, Cómo trabajamos, Nosotros y Contacto.
- `/showcase`: apertura con el índice, un proyecto por escena y cierre.

## Cómo funciona

1. Cada ruta renderiza su contenido como HTML semántico (prerenderizado en el build): una `<section>` por escena.
2. Si el navegador tiene WebGL 2, ese HTML queda oculto pero accesible, y el layout carga la escena (`src/lib/scene/stage.svelte`) con un `import()` dinámico: three y Essentia no entran al primer JS. El stage vive en el layout, así que pasar de la home al showcase no recrea el contexto WebGL.
3. Cada página es un deck de escenas a pantalla completa. La rueda, el arrastre y el teclado pasan de una a otra con una transición de profundidad: las escenas se cruzan con parallax por capas y el fondo (papel blanco con grano) bucea: sube una bruma del brand y las partículas dejan estela. Una escena que no entra en la ventana (en un teléfono) scrollea adentro antes de pasar a la siguiente. La URL sigue a la escena (`/#nosotros`), y Tab recorre los links reales del HTML: la escena lleva su sección a la vista y dibuja el foco.
4. Sin WebGL 2 o si la escena falla, se ve el HTML con `src/app.css`.

Costo por frame: el fondo y las medusas se animan solo mientras el hero está en pantalla (y nunca con `prefers-reduced-motion` o con la pestaña oculta). En las demás escenas se redibuja solo durante una transición. Hay dos niveles de captura de vidrio: el contenido (z = 1) y la navbar (z = 10).
