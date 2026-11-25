# Estándares de diseño — Tres Medusas

Las reglas visuales que todo componente respeta, en la escena 3D y en la capa
semántica. Los valores salen del código: si una regla y el código no coinciden,
manda el código y se corrige este documento.

- Colores, fuentes y logo: [`src/lib/tokens.ts`](src/lib/tokens.ts) (`PALETTE`, `FONT`, `LOGO`).
- Figuras: `FIGURE` en el mismo archivo.
- Lead-in: [`src/lib/lead-in.ts`](src/lib/lead-in.ts), [`scene/lead-in-text.svelte`](src/lib/scene/lead-in-text.svelte) y [`lead-in.svelte`](src/lib/lead-in.svelte).

La identidad todavía no está cerrada. **No hay color de marca definido: por
ahora el brand es el blanco.** No se introduce ningún color, ni azul ni otro,
hasta que la identidad lo defina. Los tokens se llaman `brand*` para que ese día
cambie solo `tokens.ts`.

## 1. Identidad

| Token        | Valor     | Uso                                                                 |
| ------------ | --------- | ------------------------------------------------------------------- |
| `paper`      | `#FFFFFF` | El fondo: papel blanco puro y liso, sin grano ni tintes de color.   |
| `ink`        | `#111111` | Títulos, lead-ins, texto que se lee primero.                        |
| `muted`      | `#5C6166` | Cuerpo de párrafo después del lead-in, etiquetas, metadatos.        |
| `brand`      | `#FFFFFF` | La luz: el botón principal y los vidrios destacados. Blanco puro, el mismo del papel: se separa con vidrio, borde o sombra. |
| `brandLight` | `#FFFFFF` | Lentes y medusas: vidrio blanco.                                    |
| `brandInk`   | `#111111` | Texto chico «de la marca» (índices, eyebrows, link activo): la tinta. |
| `brandDeep`  | `#1C1E21` | Superficies oscuras con el isotipo o iniciales en blanco.           |
| `onBrand`    | `#111111` | Texto sobre el brand.                                               |

- **Blanco y negro.** Toda la identidad se resuelve con papel, tinta y luz.
  - La jerarquía sale del contraste de la tinta (`ink` frente a `muted`), del peso y del tamaño, nunca de un color.
- **El brand es luz.** Una superficie `brand` es blanco puro sobre el papel. Siempre se separa con algo más:
  - vidrio, con rim y una sombra suave;
  - en HTML, un borde de 1 px de tinta al 8 %.
  - Nunca un bloque blanco plano sin borde, porque desaparece.
- **Sin color.** No uses hex de color en un componente, ni siquiera "temporal". Si hace falta un acento, es tinta: un trazo más grueso, un peso mayor o una superficie `brandDeep`.
  - Excepción pedida por el usuario (2026-11-19): el haz de luz del modal de los fundadores (`light-beam.ts`) usa el espectro. El color sale solo de ese shader, nunca de un hex en un componente, y no se extiende a otros componentes. (La card del fundador ya no lleva holograma ni huella, desde 2026-11-23.)
  - Excepción pedida por el usuario (2026-11-23): el botón del hero (`scene/prism-cta.svelte`) es una píldora `brandDeep` con una lente circular a la izquierda (el mismo vidrio oscurecido al 78 %, con una flecha en `white`) y el label en `white` al lado; la lente lleva un aro de vidrio por el que se ven dos haces de luz iridiscentes (`scene/prism-beams.glsl` y `scene/prism-ring.frag.glsl`): cada haz deambula por su cuenta, con su propio rango de colores, lleva el espectro a lo ancho con dispersión, bandas finas y núcleo blanco, y sus colores cambian al azar; el aro hace de lente (aumento, desvío y aberración). Los haces solo se ven en el aro, que va pegado al borde de la lente (la píldora no tiene aro), y la luz no sale de la lente, salvo en el click: los haces destellan y una onda gruesa sale del borde de la lente y cruza la píldora con los colores que tiene el aro en cada dirección (pedido del usuario, 2026-11-23; no se dibuja con movimiento reducido). Con el puntero encima solo brillan más los haces. Los valores salen del banco de pruebas que eligió el usuario. El espectro sale solo de esos shaders; en la capa semántica el botón es `brandDeep` liso, con la lente y la flecha. El hero ya no lleva franjas de luz en los bordes ni grano (pedido del usuario, 2026-11-24): su papel es liso, como el resto.

## 2. Tipografía

Lato, en tres pesos: 400 (`FONT.regular`), 700 (`FONT.bold`) y 900 (`FONT.black`). Lato no tiene 600.

| Rol                 | Peso | Color       | Notas                                         |
| ------------------- | ---- | ----------- | --------------------------------------------- |
| Display (hero, cierre) | 900 | lead-in   | Interletrado −2 % del tamaño. Sin lead-in, todo en `ink`. |
| Título de sección   | 700  | lead-in     | Sin lead-in, todo en `ink`.                   |
| Etiqueta / eyebrow  | 700  | `brandInk` o `muted` | Mayúsculas, 12–14 px, interletrado amplio. |
| Párrafo             | 400  | lead-in     | Siempre con `LeadInText` / `LeadIn`.          |

## 3. Lead-in text highlight

Títulos y párrafos usan lead-in: la primera oración va en `ink` y el resto en
`muted`, **con el mismo peso**. El contraste lo hace solo el color. En un
título es donde más se luce.

> **Entendemos el problema.** <span style="color:#5C6166">Antes de escribir código, mapeamos cómo trabaja hoy tu equipo.</span>

**Pesos**
- En un párrafo, todo va en 400.
- En un título, todo va en el peso del título: 700 o 900.

**Dónde va**
- Títulos: hero, secciones, cierre y nombre de proyecto si tiene dos partes. Por ejemplo, «**Software a medida.** <span style="color:#5C6166">Para lo que hoy se hace a mano.</span>»
- Bajadas de hero y secciones.
- Pasos de HowWork.
- Bios de fundadores.
- Problema y solución de cada proyecto.
- El texto del contacto.

**Dónde no va**
- Etiquetas y eyebrows.
- Botones y chips.
- El titular del hero (excepción pedida por el usuario, 2026-11-24): en vez de lead-in, el contraste lo hacen las palabras que rotan, en `ink` y 900, sobre el texto fijo en `muted` y 400. Peso y color distintos solo acá.

**Una sola oración**
- Si el texto tiene una sola oración, no hay lead-in.
- Un título va entero en `ink`.
- Un párrafo va entero en `muted`, o en `ink` si es protagonista.

**Cómo escribir el texto**
- El lead-in es la primera oración, cerrada por `.`, `?`, `!` o `:`.
- Tiene que ser corta, de 2 a 6 palabras: una afirmación que se entienda sola.
- En un título, la segunda parte la completa o la matiza; también es corta.
- Si pasa de 72 caracteres, el párrafo no se resalta.

**Cómo usarlo**
- En la escena: `<LeadInText text={...} fontSize={...} maxWidth={...} />` desde `$lib/scene/lead-in-text.svelte`.
  - Acepta los mismos props que `MeasuredText`, salvo el color.
  - En un título pasa `font={FONT.bold}` o `FONT.black` y `plain="ink"`, para que una sola oración vaya en tinta.
  - `section-head.svelte` ya lo usa en el título y la intro.
- En la capa semántica: `<h2><LeadIn text={...} /></h2>` o `<p><LeadIn text={...} /></p>` desde `$lib/lead-in.svelte`.
- No se arma a mano con dos textos. `LeadInText` es un solo texto de troika con tramos de color, así el ajuste de línea es el del párrafo entero.

## 4. Imágenes y figuras: estética Linear

Minimalismo técnico: figuras construidas con línea, no ilustraciones. Los
valores salen de `FIGURE` en `tokens.ts`.

**Línea**
- Trazos de 1 px (`strokeWidth`) en `ink` con opacidad 0.22.
- Solo el elemento que importa lleva 1.5 px y opacidad 0.6.
- Sin contornos negros plenos.

**Color**
- Monocromo en tinta, más **un solo acento** por figura: el punto, la línea o el nodo que cuenta la idea.
- Mientras no haya color de marca, el acento es `FIGURE.accent`: la tinta con el trazo destacado (1.5 px, opacidad 0.6) o un relleno `brandDeep`.

**Superficies**
- Rellenos casi transparentes: tinta al 3 %.
- Sin degradados de color.
- Si hace falta profundidad, un desvanecido de la misma tinta hacia el papel.

**Fondo**
- Grilla o puntos cada 24 px al 6 %, que se intuyen pero no se leen.
- Se desvanecen hacia los bordes de la figura.

**Forma**
- Geometría simple: rectángulos con radio de 16 px, círculos, líneas rectas y conectores en ángulo recto.
- Diagramas de flujo, nodos, capas, interfaces esquemáticas.

**Aire**
- La figura ocupa como máximo el 70 % de su marco.
- Nada toca el borde.

**Materia**
- El único efecto rico es el vidrio de Essentia (`Glass`): una lente o un panel que refracta la figura.
- Sin sombras duras, brillos ni texturas: el papel es liso.

**Imágenes**
- Las capturas de producto van en un marco con radio de 16 px, borde de 1 px de tinta al 10 % y sin sombra.

**Prohibido**
- Fotos de stock e ilustraciones con personajes.
- Clipart 3D y emojis.
- Íconos de varios colores.
- Degradados de arcoíris.
- Mockups de dispositivos recargados.

**Formato**
- Las figuras estáticas van en SVG en `static/figures/`, con `stroke` y `fill` según `FIGURE`, y `vector-effect="non-scaling-stroke"` para que el grosor no cambie al escalar.
- Las figuras dibujadas en la escena usan los mismos tokens.
- Un SVG que la escena carga como textura (`<Image>`) va con el `viewBox` en px CSS y `width`/`height` a 3×, como el logo, y **sin** `vector-effect`: la textura se rasteriza a 3×, y un trazo que no escala quedaría en un tercio de píxel. Así los trazos de 1 y 1,5 px se ven de 1 y 1,5 px.

**Figuras 3D**
- Cuando una figura tiene que cargar la idea (las etapas de HowWork), va en 3D: vista isométrica ortográfica (azimut 45°, elevación ~32°), armada con el kit de [`scene/figures/kit.ts`](src/lib/scene/figures/kit.ts).
- Mismas reglas de línea: trazos de 1 px (`LineMaterial`, en px CSS) con la tinta al 22 % ya mezclada con el papel, opacos, para que la profundidad tape las líneas de atrás. El acento, 1.5 px al 60 % o una superficie `brandDeep`.
- Caras: arriba blanco (`brand`, la luz) y los lados un desvanecido de la tinta (5 % y 9 %). Grilla de puntos en el piso y sombras suaves de tinta hacia el papel.
- Cada figura se dibuja en su propio render target y entra a la escena como un quad transparente: se funde con su opacidad y los vidrios la refractan. Lo que llega al borde del marco (grilla, sombras) se desvanece en 40 px: nada se corta en seco. Una lente va con el `Glass` de Essentia (preset `lens`), a z 1 como los demás vidrios del contenido.
- Movimiento lento y en bucle (un vaivén y la acción que cuenta la idea), solo mientras se ve; con movimiento reducido, un cuadro fijo (`REST`).
- La capa semántica muestra ese cuadro fijo exportado en WebP (`static/figures/`), con fondo transparente.

## 5. Vidrio, espacio y movimiento

**Vidrio**
- Sobre el papel, el vidrio puede ser limpio, sin tinte (`tintOpacity` en 0), o con un tinte claro (blanco o gris muy claro).
- En los dos casos, cuánto se aclara o se oscurece contra el papel se ajusta con `brightness`. El tinte no está para eso.
- Ojo con los presets que traen brillo negativo, como `crystal-ui` (`brightness` −0.07, `tintOpacity` 0.2). Sin ajustar, oscurecen el papel y el vidrio se ve gris sucio.
- Sombras suaves: opacidad de 0.1 como máximo.

**Espacio**
- Cada escena tiene una idea.
- Antes de achicar el texto, quitar contenido.
- Márgenes amplios, en múltiplos de 8 px.

**Movimiento**
- Las transiciones son del deck. Los componentes acompañan con parallax (`lag(k)`), sin animaciones propias que compitan.
- `/showcase` es una galería: en vez de subir, las escenas cuelgan a lo largo de un pasillo y el deck mueve la cámara hacia el punto de fuga (`scene/gallery.ts`). Pedido por el usuario (2026-11-16). En reposo cada escena se ve centrada; entre proyectos la cámara gira de una pared a la otra.
- La excepción son las figuras 3D (§4): un bucle lento que cuenta la idea, solo mientras la figura se ve.
- El hero es el titular, el botón, una figura y el fondo, sin logo (pedido del usuario, 2026-11-24). El titular, «Construimos **el software** que tu **empresa** necesita.», tiene palabras que rotan (`scene/headline.ts`): qué construimos (artículo y sustantivo, que concuerdan) y para quién, de a un grupo por vez, cada ~3 s; lo que cambia se desvanece y vuelve, y el resto se corre suave a su lugar. Con movimiento reducido queda quieto en la primera combinación. La figura y el botón también corren con el reloj del hero, solo mientras se ve.
- La figura del hero (pedido del usuario, 2026-11-24) va debajo del botón, tan ancha como la columna (hasta 1100 px) y pegada al borde de abajo de la ventana, por detrás de la navbar; si no entra con su alto natural, se recorta por abajo, y lo que sobra se reparte entre arriba del titular y entre el botón y la figura. Muestra lo que nombra el titular: una app, un tablero de marca o un lienzo de diseño (`scene/figures/hero.ts`). Es plana, en línea fina con los tokens `FIGURE`, con un solo acento, y se pierde en el papel hacia abajo con un difuminado blanco largo. Para que no parezca un boceto (pedido del usuario, 2026-11-24) tiene detalle de interfaz real: los renglones de texto son barras redondeadas de tinta al 5, 9 y 16 % (texto suave, texto y títulos) en vez de líneas; las barras laterales y los paneles van un paso más oscuros (5 %); los botones primarios, la herramienta elegida y los tonos fuertes de la paleta van rellenos al 75–82 %, y la placa tiene una sombra suave de tinta (≤ 0.1). Los rellenos se mezclan con el papel en sRGB, como en el navegador, para que la escena, la capa semántica y el banco de pruebas se vean igual. Cuando el titular cambia «qué construimos», un panel de vidrio limpio (`Glass`, sin dispersión) cruza la figura: a su izquierda ya está la figura nueva y a su derecha la de antes (`scene/hero-figure.svelte`). Es la otra excepción de movimiento: solo se mueve en ese cambio, que sigue al titular. Sin lupa (pedido del usuario, 2026-11-24: no se entendía). Con movimiento reducido queda la primera figura, sin cambios. Si el alto no alcanza, no se muestra. Su tamaño (ancho y alto del marco), el difuminado y el panel salen de `LOOK` y del banco de pruebas que eligió el usuario; ahí la placa ocupa el 85 % del ancho del marco, más que el 70 % de §4, y no se desvanece arriba ni a los costados: solo abajo. En la capa semántica va la misma figura en SVG (`lib/hero-figure.svelte`).
- El click del botón del hero destella (haces del aro hasta 3.5 veces más brillantes, apagándose en ~0.6 s) y lanza una onda que cruza la píldora en ~0.7 s; la página espera 650 ms antes de bajar, para que se vea (con movimiento reducido navega enseguida, sin destello).
- Todo respeta `prefers-reduced-motion`.

## 6. Alineación: centrado por convención

El contenido de todo componente va **centrado**:
- la columna, centrada en la ventana;
- el texto, alineado al centro (`alignment="center"` y `anchorX={0.5}` en la escena, `text-align: center` en la capa semántica);
- los botones, chips y grupos, centrados en su fila;
- las grillas, centradas como bloque.

**Lectura**
- Un párrafo centrado necesita una medida corta: como máximo unos 60 caracteres por línea (`maxWidth` acorde al tamaño).
- Si no entra, se acorta el texto o se parte en más párrafos, no se alinea a la izquierda.

**Excepciones**
- Alinear a la izquierda (u otra disposición) es una decisión intencional, y **solo se hace si el usuario lo pide explícitamente para ese componente**. No se decide por estética ni por comodidad del layout.
- Cada excepción pedida se anota acá, con el componente y la fecha:

| Componente | Alineación | Pedido |
| ---------- | ---------- | ------ |
| Pie (`scene/footer.svelte`, `footer` del layout) | El logo va centrado. La franja de abajo, en escritorio, a los costados: «Powered by Essentia» a la izquierda; copyright y términos a la derecha. En una columna vuelve a centrado y apilado. | 2026-11-23, con el rediseño del pie. |
| Botón del hero (`scene/prism-cta.svelte`) | La lente con la flecha a la izquierda y el label al lado, no centrado. | Usuario, 2026-11-23: variante «Lente» con icono y aro. |

## Checklist de un componente

- [ ] Contenido centrado, salvo una excepción pedida y anotada en la sección 6.
- [ ] Colores desde `PALETTE`, sin hex sueltos.
- [ ] Títulos y párrafos con `LeadInText` en la escena y `LeadIn` en la capa semántica.
- [ ] Ningún color fuera de la paleta: sin azul ni otro tono hasta que la identidad lo defina.
- [ ] Las superficies `brand` (blancas) se separan del papel con vidrio, borde o sombra.
- [ ] Figuras con `FIGURE`: monocromo, un acento y línea fina.
- [ ] La capa semántica dice lo mismo que la escena.
