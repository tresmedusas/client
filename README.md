# Tres Medusas — landing

Landing inicial de Tres Medusas, hecha con [Essentia](https://github.com/urielri/essentia) (Svelte 5 + Threlte + three.js): lo que se ve se dibuja en la GPU (vidrio, fondo marino animado, texto SDF) y el HTML prerenderizado queda para SEO, accesibilidad y como versión sin WebGL.

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
| Textos, links, correo y LinkedIn | `src/lib/content.ts` (única fuente: la usan el HTML y el canvas) |
| Colores y fuentes (identidad provisoria) | `src/lib/tokens.ts`, fuentes en `static/fonts/` |
| Fondo marino, haces de luz, tentáculos | `src/lib/scene/ocean.frag.glsl` |
| Posición y tamaño de las medusas | `medusas()` en `src/lib/scene/layout.ts` |
| Estilo sin WebGL | `src/app.css` |

## Cómo funciona

1. `src/routes/+page.svelte` renderiza el contenido como HTML semántico (prerenderizado en el build).
2. Si el navegador tiene WebGL 2, ese HTML queda oculto pero accesible, y se carga la escena (`src/lib/scene/stage.svelte`) con un `import()` dinámico: three y Essentia no entran al primer JS.
3. La escena dibuja el mismo contenido. El scroll es de la escena (rueda, arrastre y teclado) para que los vidrios refracten lo que pasa por debajo. Tab recorre los links reales del HTML y la escena lleva la sección a la vista y dibuja el foco.
4. Sin WebGL 2 o si la escena falla, se ve el HTML con `src/app.css`.

Costo por frame: el fondo y las medusas se animan solo mientras el hero está en pantalla (y nunca con `prefers-reduced-motion` o con la pestaña oculta). Más abajo, la escena se redibuja solo al scrollear. Hay dos niveles de captura de vidrio: el contenido (z = 1) y la navbar (z = 10).
