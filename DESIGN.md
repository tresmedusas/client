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
  - Excepción pedida por el usuario (2026-11-23): el botón del hero (`scene/prism-cta.svelte`) es una píldora `brandDeep` con una lente circular a la izquierda (el mismo vidrio oscurecido al 80 % y, desde 2026-11-26, translúcido: deja ver el vidrio y los haces de atrás; con una flecha en `white`) y el label en `white` al lado; la lente lleva un aro de vidrio por el que se ven dos haces de luz iridiscentes (`scene/prism-beams.glsl` y `scene/prism-ring.frag.glsl`): cada haz deambula por su cuenta, con su propio rango de colores, lleva el espectro a lo ancho con dispersión, bandas finas y núcleo blanco, y sus colores cambian al azar; el aro hace de lente (aumento, desvío y aberración). Los haces solo se ven en el aro, que va pegado al borde de la lente (la píldora no tiene aro), y la luz no sale de la lente, salvo en el click: los haces destellan y una onda gruesa sale del borde de la lente y cruza la píldora con los colores que tiene el aro en cada dirección (pedido del usuario, 2026-11-23; no se dibuja con movimiento reducido). Con el puntero encima solo brillan más los haces. Los valores salen del banco de pruebas que eligió el usuario y viven en `PRISM_LOOK` (`scene/prism-look.ts`): los haces, el aro, la lente, el click y la píldora. El banco también ajusta el vidrio de la píldora (tinte, refracción, dispersión, bisel, esmerilado…) y los haces en la píldora (pedido del usuario, 2026-11-25): siguen de largo desde la lente, o deambulan por toda la píldora, y van **debajo** del vidrio (2026-11-26), así el vidrio los refracta, los esmerila y los tiñe; la lente, el aro, la onda y el label van encima. Desde 2026-11-26 `PRISM_LOOK` los enciende suaves bajo el tinte `brandDeep` al 80 %. En la navbar el vidrio del botón va a z 11, el nivel del lente del link activo: así sus haces quedan fuera de la captura de los bordes que deforman, que si no los reflejarían. Con `npm run dev` hay un banco de pruebas del botón (`src/lib/lab/prism-lab*`, pedido del usuario, 2026-11-25): un panel a la izquierda que los ajusta en vivo, los guarda en el navegador y copia el look como código para pegar en `prism-look.ts`. Es una herramienta de trabajo y no entra al build, así que no sigue las reglas de esta guía. El espectro sale solo de esos shaders; en la capa semántica el botón es `brandDeep` liso, con la lente y la flecha. Los haces son reutilizables (2026-11-26): sus valores (`BeamLook`) viven en `scene/beam-look.ts`, que `PRISM_LOOK` extiende, y `scene/light-beams.svelte` los dibuja en un rectángulo, o en una franja bajo un borde de arriba (`side="top"`), con sus propios valores (`FieldLook`). Hoy ningún componente fuera del botón los usa; llevarlos a otro es una excepción nueva de esta sección. El botón entero también va en Contacto, con «Contáctanos», que abre WhatsApp (pedidos del usuario, 2026-11-27): el mismo `scene/prism-cta.svelte`, como el principal de su fila de botones (`prism` en `scene/cta-group.svelte`), con su propio reloj, que corre solo mientras Contacto se ve. Como WhatsApp abre otra pestaña, ese link se abre en el click mismo (si no, el navegador puede bloquearlo) y el destello sigue en la página; los links de la misma página esperan la onda, como antes. En la capa semántica es el mismo `brandDeep` con la lente y la flecha que el del hero. El hero ya no lleva franjas de luz en los bordes ni grano (pedido del usuario, 2026-11-24): su papel es liso, como el resto.
  - Excepción pedida por el usuario (2026-11-25): el reflejo de los bordes de arriba y de abajo del showcase (`scene/edge-warp.frag.glsl`, `SHOWCASE_WARP`) toma el color de las previsualizaciones de los casos, con el croma subido. No es un color de la identidad: es el del contenido (capturas e imágenes de cada caso) y sale solo de ese shader; sobre el papel blanco no se ve.

## 2. Tipografía

Lato, en tres pesos: 400 (`FONT.regular`), 700 (`FONT.bold`) y 900 (`FONT.black`). Lato no tiene 600.

| Rol                 | Peso | Color       | Notas                                         |
| ------------------- | ---- | ----------- | --------------------------------------------- |
| Display (hero, entrada del showcase al mismo tamaño) | 400 / 900 | titular inline | Interletrado −2 % del tamaño. Texto en `muted` 400, lo destacado en `ink` 900. |
| Título de sección (Contacto incluido), paso, proyecto | 400 / 900 | titular inline | Igual que el display, a su tamaño. Contacto usa el tamaño de sección, no el display (pedido del usuario, 2026-11-25). |
| Etiqueta / eyebrow  | 700  | `brandInk` o `muted` | Mayúsculas, 12–14 px, interletrado amplio. |
| Párrafo             | 400  | lead-in     | Siempre con `LeadInText` / `LeadIn`.          |

## 3. Titulares inline y lead-in

**Titular inline (títulos)** — pedido del usuario, 2026-11-25, tomando de
referencia el titular del hero. Todo título (hero, secciones, cierre, pasos de
HowWork, nombres de proyecto) va con el texto en `muted` y 400, y las palabras
que cuentan en `ink` y 900, dentro de la misma frase:

> <span style="color:#5C6166">Primero,</span> **el problema.** <span style="color:#5C6166">Después, la herramienta.</span>

- Lo destacado se marca en `content.ts` con `**…**`. Sin marcas se destaca la primera oración (el lead-in); si tampoco hay, el título entero.
- Títulos animados (el hero y la entrada del showcase): lo que rota es lo destacado, en `ink` 900, y el resto queda en `muted` 400. Al cambiar, la palabra se desvanece y vuelve con la nueva, y el texto fijo se corre suave a su lugar, con los tiempos de `scene/headline.ts`. El del showcase rota una sola palabra (`RotatingTitle`, `scene/rotating-headline.svelte`); su primera variante es el `title` de la sección, el que ve la capa semántica y el que queda quieto con movimiento reducido.
- Destacar poco: uno o dos grupos cortos por título, como en el hero.
- En la escena: `<InlineHeadline text={...} fontSize={...} maxWidth={...} />` desde `$lib/scene/inline-headline.svelte`. troika no mezcla fuentes en un texto, así que cada tramo es un texto aparte acomodado con `flow` (como el hero). `section-head.svelte` ya lo usa.
- En la capa semántica: `<h2><InlineHeadline text={...} /></h2>` desde `$lib/inline-headline.svelte` (`<strong>` para lo destacado).

**Lead-in (párrafos)** — la primera oración va en `ink` y el resto en
`muted`, **con el mismo peso** (400). El contraste lo hace solo el color.

> **Entendemos el problema.** <span style="color:#5C6166">Antes de escribir código, mapeamos cómo trabaja hoy tu equipo.</span>

**Dónde va el lead-in**
- Bajadas de hero y secciones.
- Pasos de HowWork.
- Bios de fundadores.
- Problema y solución de cada proyecto.
- El texto del contacto.

**Dónde no va**
- Etiquetas y eyebrows.
- Botones y chips.
- Los títulos: van con titular inline (arriba).

**Una sola oración**
- Si el párrafo tiene una sola oración, no hay lead-in: va entero en `muted`, o en `ink` si es protagonista.

**Cómo escribir el texto**
- El lead-in es la primera oración, cerrada por `.`, `?`, `!` o `:`.
- Tiene que ser corta, de 2 a 6 palabras: una afirmación que se entienda sola.
- Si pasa de 72 caracteres, el párrafo no se resalta.

**Cómo usarlo**
- En la escena: `<LeadInText text={...} fontSize={...} maxWidth={...} />` desde `$lib/scene/lead-in-text.svelte`.
  - Acepta los mismos props que `MeasuredText`, salvo el color.
  - `section-head.svelte` ya lo usa en la intro.
- En la capa semántica: `<p><LeadIn text={...} /></p>` desde `$lib/lead-in.svelte`.
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
- Los casos del showcase (pedido del usuario, 2026-11-25) son cards apaisadas, 3:2 (4:5 en un teléfono; pedido del usuario, 2026-11-25: más anchas), con la previsualización del caso, sin texto (ni tipo ni nombre: la información va en la página del caso, que se abre al hacer click en la card; con el foco del teclado en su link, la card lleva un halo de tinta como el de los botones): una captura o una imagen, todavía sin video (`scene/case-card.svelte`). Van en fila, separadas por 94 px (16 px en un teléfono), y son tan altas como la ventana entre la navbar y el pie de la escena (pedido del usuario, 2026-11-25), con tope en 990 px de ancho y el 90 % de la ventana (`CASE_LOOK`, valores ajustados por el usuario en el banco de pruebas) y la card centrada queda siempre afuera de las franjas de los costados (`caseCard` en `scene/layout.ts`). Como van de una landing a un manual de marca, un logo o una app, cada caso dice cómo encaja (`preview` en `content.ts`): `cover` llena la card y recorta (una captura alta de una landing, anclada arriba con `align: 'top'`), y `contain` la deja entera con aire sobre el papel o `brandDeep` (un logo). Las imágenes van en `static/casos/`; las de ejemplo son SVG monocromos en estética Linear, para reemplazar por las reales.

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
- En HowWork las figuras son protagonistas y llevan más tinta (pedido del usuario, 2026-11-26, elegido en el banco de pruebas; `HOW_LOOK` en `scene/how-work-look.ts`): trazos al 45 % en lugar del 22 %, los lados de los volúmenes ×1.8 (9 % y 16 %) y el acento como un sólido `brandDeep` en cada figura (la lupa entera, la tarea en curso, la caja del hito, el sello), no solo un trazo destacado. Sin placa detrás. Miden el 60 % del alto de la ventana (lo que deje el texto más largo, y no más ancho que la ventana). El resto de las figuras sigue con los valores de `FIGURE`.
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
- Nosotros y el cierre (Contacto) llenan la ventana (pedido del usuario, 2026-11-25): en Nosotros las cards crecen hasta ocupar el alto que deja el encabezado (hasta el ancho de su celda, estirándose como mucho un 15 %); el cierre (Contacto) ocupa solo toda la ventana, con el título y los botones centrados bajo la navbar, y el pie va debajo: se ve al seguir scrolleando (scroll interno de la escena). Si el contenido no entra, también scrollea adentro. Desde 2026-11-27 (pedido del usuario), Contacto es un componente que llena toda la pantalla, desde detrás de la navbar hasta el pie, y el título y el botón van centrados en él, en el centro de la ventana (`fullscreen` en `scene/closing.svelte`): papel liso, sin haces, borde ni figuras (pedido del usuario, 2026-11-27: no quiere figuras en Contacto). Al llegar se desempaña (pedido del usuario, 2026-11-27, elegida entre cuatro propuestas; `scene/contact-look.ts`, `CONTACT_FROST`): mientras la escena sube, un vidrio esmerilado (`Glass` con tinte de papel, sin refracción, rim ni sombra) cubre todo el componente y el contenido llega fuera de foco, con un velo de papel y un 6 % más grande; con el scroll se aclara y queda nítido, en escala 1, justo cuando el componente llena la pantalla. El vidrio va a z 9.9995, en el nivel de captura de la navbar y de los bordes que deforman (Essentia tiene tres niveles: z 1, z 10 y z 11), así la navbar queda nítida. Va con el scroll y no se repite al irse hacia arriba. Con movimiento reducido no hay empañado. En la capa semántica no hay efecto. Contacto queda libre de la regla de movimiento de esta sección (pedido del usuario, 2026-11-27: «tomate la libertad de hacer lo que quieras con las animaciones»). Lleva dos botones, centrados en una fila (pedidos del usuario, 2026-11-27; sin el mail ni LinkedIn desde 2026-11-26): el del hero (§1), «Contáctanos», que abre WhatsApp, y uno secundario, «Conocer nuestros trabajos», que lleva a `/showcase`. Los dos van también en la capa semántica.
- Las secciones de la home (Cómo trabajamos, Nosotros, Contacto) no llevan etiqueta sobre el título ni número, y los pasos de HowWork tampoco van numerados (pedidos del usuario, 2026-11-25): la etiqueta repetía la navbar. El título abre la sección.
- El indicador de escenas (`scene/scene-dots.svelte`) usa puntos redondos de 6 px; el de la escena que se ve se estira en una píldora.
- En `/showcase`, la navbar lleva a la derecha de la pastilla de los links el botón del hero, «Agendar reunión» (pedido del usuario, 2026-11-25): el mismo `scene/prism-cta.svelte`, en su propia isla y a la altura de la barra (z 11, el nivel del lente del link activo, sobre los bordes que deforman), con el conjunto (logo, links y botón) centrado. Si no entra al lado de la pastilla entera, como en un teléfono, no se muestra: el link de Contacto lleva al mismo lugar. En la capa semántica va dentro del `header`.
- Los bordes por donde entra y sale el contenido con el scroll lo deforman al pasar (`scene/edge-warp.svelte`, con los valores en `scene/edge-warp.ts`): arriba y abajo en la home, a los costados en el showcase (el eje del look, `WarpAxis`). En la home es una franja angosta (45 px) en la que el contenido se dobla como sobre un cilindro.
- `/showcase` (rediseño pedido por el usuario, 2026-11-25, en lugar de la galería en un pasillo): una sola escena, por ahora sin cierre (pedido del usuario, 2026-11-25). Entra como el hero de la home: el título al mismo tamaño que el titular del hero (`heroLayout`, sin bajada) y animado como él, con la primera palabra rotando: «**Empresas** / **Marcas** / **Emprendedores** / **Colegios** que confiaron en nosotros.», en dos líneas fijas en escritorio (corta antes de «en») para que no salte al rotar (pedidos del usuario, 2026-11-25), arriba y, en lugar de la figura, los casos, que arrancan al 62 % del alto de la ventana (unos 100 px por debajo de la mitad, para que se vea más el scroll hasta ellos) cortados por el borde de abajo (`showcaseIntro` en `scene/layout.ts`). El scroll primero sube todo: el título se va por arriba (y se apaga mientras sube) y la card queda centrada en la ventana; si es más baja que la ventana (por su tope de ancho o las franjas), igual sube hasta centrarla. Los casos van en fila (pedido del usuario, 2026-11-25: se desplazan de costado y los efectos van invertidos respecto de la home): después, el scroll de la página los corre de derecha a izquierda 1:1, de la primera card centrada a la última (el recorrido horizontal de la escena: `track` en `SceneSlot`); la rueda vertical, el trackpad de costado y el arrastre de costado en un teléfono la mueven (`swipeX` del deck). Los bordes son los protagonistas (`SHOWCASE_WARP`, eje horizontal): las franjas van a los costados (hasta 150 px, como mucho el 22 % del ancho; 60 px en un teléfono) y en ellas las cards vecinas se estiran hacia el borde, como si se lo tragara, y se abren a lo alto, con una aberración marcada (canales separados hasta 18 px), blur y líquido. Las franjas se ajustan a la ventana y la card centrada tiene prioridad (pedido del usuario, 2026-11-25; `showcaseBand` en `scene/layout.ts`): toman lo que la card deja a cada costado, como mucho 150 px y nunca menos de 60 (`minHeight`); recién por debajo de ese mínimo (unos 1134 px de ancho) la card se achica. La card centrada y el título nunca tocan esas franjas. En un teléfono las cards siguen en 4:5 y las limita el ancho (las franjas de 60 px), así que no llenan el alto. Los bordes de arriba y de abajo llevan el reflejo de los casos: en una franja (86 px, como mucho el 25 % del alto de la ventana), cada borde hace de espejo curvo y muestra, muy difuminado, estirado a lo largo del borde y con el croma subido, el contenido que tiene cerca (hasta 80 px). No ocupa todo el borde: es un óvalo pegado al centro de cada uno (52 % del ancho de la ventana, más angosto y más suave hacia los costados) que se enciende entero mientras un caso está cerca del centro de la ventana (hasta un 20 % del ancho de la card) y se apaga a lo largo de otro 30 %, hasta nada cuando llega el espacio entre dos cards (`reflectFocus`). Los valores de `SHOWCASE_WARP` los ajustó el usuario en el banco de pruebas (2026-11-25), ya con la fila horizontal. Todos los valores de los bordes (home y showcase) se ajustan en vivo con el banco de pruebas (`src/lib/lab/`, pedido del usuario, 2026-11-25): un panel que aparece solo con `npm run dev`, guarda lo ajustado en el navegador y copia el look como código para pegar en `edge-warp.ts`. Es una herramienta de trabajo y no entra al build, así que no sigue las reglas de esta guía (sus controles van alineados a la izquierda). Sin WebGL, la capa semántica lista los casos uno debajo del otro, cada uno con su link.
- La página de cada caso (`/showcase/{id}`, pedido del usuario, 2026-11-25) es una sola escena con el eje vertical de la home: el nombre como título (entero destacado) y el contexto con lead-in, centrados; debajo, la previsualización grande con la proporción y el ancho máximo de las cards del showcase, y el pie (`scene/case-detail.svelte`, `caseSection` en `content.ts`). Sin etiqueta ni «Agendar reunión» (pedido del usuario, 2026-11-26). Volver al showcase es un botón redondo con una flecha hacia la izquierda, sin texto, al costado izquierdo del título (pedido del usuario, 2026-11-26; `scene/back-button.svelte`): el vidrio de los botones secundarios, del alto de los botones, centrado en la primera línea del título; el título deja ese lugar a los dos lados para seguir centrado. En la capa semántica es un link «← Volver al showcase» arriba del título. En la navbar queda activo Showcase. Al abrir un caso desde su card, los bordes se tragan el showcase (pedido del usuario, 2026-11-26, elegida entre tres demos; `scene/case-transition.ts`, `CASE_TRANSITION`): las franjas de los costados se cierran hasta el centro, con el estirado, la separación de canales, el blur y el líquido exagerados, el papel tapa todo al cambiar de página y la página del caso aparece cuando las franjas (las suyas, arriba y abajo) se retiran. La otra demo, «la card se abre en su página» (lo demás se apaga bajo un velo de papel y la card viaja hasta el lugar de su previsualización), queda guardada para más adelante y se puede probar en el banco de pruebas, que también muestra la transición en cámara lenta; la tercera, la zambullida en la card, se descartó. Al volver al showcase desde un caso (el botón de volver o el link de la navbar), la misma transición de vuelta (pedido del usuario, 2026-11-26): los bordes del caso se tragan la página y el showcase aparece cuando sus franjas se retiran; con «la card se abre» elegida en el banco de pruebas, la vuelta va sin transición. Durante la transición la escena no responde al scroll; con movimiento reducido no hay transición. Atrás del navegador no tiene transición. Al volver de un caso al showcase (con el botón, la navbar o atrás del navegador), el showcase arranca en la card de ese caso, centrada y con el título ya ido (pedido del usuario, 2026-11-26; `startCase` en `scene/showcase-scene.svelte`, `jump` del deck); entrando desde otra página, arranca desde el principio.
- Las figuras 3D (§4) se mueven en un bucle lento que cuenta la idea, solo mientras la figura se ve.
- «Cómo trabajamos» pasa de una etapa a la otra en **hojas de vidrio** (pedido del usuario, 2026-11-26, elegido entre tres demos en el banco de pruebas; `scene/how-work-look.ts`): cada etapa es una hoja del alto de la ventana, con la figura y el texto centrados bajo la navbar. El scroll interno primero sube la primera hoja hasta llenar la ventana (el encabezado se va por arriba); después la escena queda quieta y el resto del scroll es un recorrido (`track` del deck, como la fila del showcase): cada hoja se queda quieta un 35 % del alto de la ventana para leerla y la siguiente sube desde abajo, 1:1 con el scroll. La que sube es un `Glass` esmerilado (blur 14 px, refracción 0.6, esquinas con radio de 58 px desde 2026-11-27, elegido por el usuario en el banco de pruebas; sombra casi nula: 0.015) que deja ver la anterior desenfocada y se vuelve papel al llegar arriba; su contenido aparece mientras sube. La de atrás se hunde hasta el 92 % bajo un velo de tinta muy leve (0.5 %); con movimiento reducido no se achica. Las otras dos demos quedan en el banco de pruebas (pestaña «Cómo trabajamos», `src/lib/lab/how-lab*`): de corrido (las etapas una debajo de la otra, unidas por un trazo) y hojas apiladas (la que sube es papel opaco con sombra). El banco copia el look para pegar en `how-work-look.ts`.
- El hero es el titular, el botón, una figura y el fondo, sin logo (pedido del usuario, 2026-11-24). El titular, «Construimos **el software** que tu **empresa** necesita.», tiene palabras que rotan (`scene/headline.ts`): qué construimos (artículo y sustantivo, que concuerdan) y para quién, de a un grupo por vez, cada ~3 s; lo que cambia se desvanece y vuelve, y el resto se corre suave a su lugar. Con movimiento reducido queda quieto en la primera combinación. La figura y el botón también corren con el reloj del hero, solo mientras se ve.
- La figura del hero (pedido del usuario, 2026-11-24) va debajo del botón, tan ancha como la columna (hasta 1100 px) y pegada al borde de abajo de la ventana; si no entra con su alto natural, se recorta por abajo, y lo que sobra se reparte entre arriba del titular y entre el botón y la figura. Muestra lo que nombra el titular: una app, un tablero de marca o un lienzo de diseño (`scene/figures/hero.ts`). Es plana, en línea fina con los tokens `FIGURE`, con un solo acento, y se pierde en el papel hacia abajo con un difuminado blanco largo. Para que no parezca un boceto (pedido del usuario, 2026-11-24) tiene detalle de interfaz real: los renglones de texto son barras redondeadas de tinta al 5, 9 y 16 % (texto suave, texto y títulos) en vez de líneas; las barras laterales y los paneles van un paso más oscuros (5 %); los botones primarios, la herramienta elegida y los tonos fuertes de la paleta van rellenos al 75–82 %. La placa no lleva sombra, tiene rectas las esquinas de abajo (solo las de arriba van redondeadas) y sigue hacia abajo, con sus paneles y divisores, hasta salir del marco, para ocupar todo su alto (pedidos del usuario, 2026-11-27). Los rellenos se mezclan con el papel en sRGB, como en el navegador, para que la escena, la capa semántica y el banco de pruebas se vean igual. Cuando el titular cambia «qué construimos», un panel de vidrio limpio (`Glass`, sin dispersión) cruza la figura: a su izquierda ya está la figura nueva y a su derecha la de antes (`scene/hero-figure.svelte`). La figura solo se mueve en ese cambio, que sigue al titular. Sin lupa (pedido del usuario, 2026-11-24: no se entendía). Con movimiento reducido queda la primera figura, sin cambios. Si el alto no alcanza, no se muestra. Su tamaño (ancho y alto del marco), el difuminado y el panel salen de `LOOK` y del banco de pruebas que eligió el usuario; ahí la placa ocupa el 85 % del ancho del marco, más que el 70 % de §4, y no se desvanece arriba ni a los costados: solo abajo. En la capa semántica va la misma figura en SVG (`lib/hero-figure.svelte`).
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
| Botón del hero (`scene/prism-cta.svelte`, también en la navbar del showcase) | La lente con la flecha a la izquierda y el label al lado, no centrado. | Usuario, 2026-11-23: variante «Lente» con icono y aro. |
| Volver al showcase, en la página de un caso (`scene/back-button.svelte`) | El botón va al costado izquierdo del título; el título sigue centrado. | Usuario, 2026-11-26. |

## Checklist de un componente

- [ ] Contenido centrado, salvo una excepción pedida y anotada en la sección 6.
- [ ] Colores desde `PALETTE`, sin hex sueltos.
- [ ] Títulos con `InlineHeadline` y párrafos con `LeadInText` en la escena; `InlineHeadline` y `LeadIn` en la capa semántica.
- [ ] Ningún color fuera de la paleta: sin azul ni otro tono hasta que la identidad lo defina.
- [ ] Las superficies `brand` (blancas) se separan del papel con vidrio, borde o sombra.
- [ ] Figuras con `FIGURE`: monocromo, un acento y línea fina.
- [ ] La capa semántica dice lo mismo que la escena.
