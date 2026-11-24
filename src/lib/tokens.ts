/**
 * Valores visuales de la landing, sin imports: `+layout.svelte` los publica
 * como variables CSS para el primer paint, y three y troika no pueden entrar a
 * ese JS. La escena los lee de acá también.
 *
 * Identidad: blanco y negro sobre papel blanco liso. El color de la
 * marca todavía no está definido, así que el brand es el blanco: superficies
 * de luz (vidrio blanco, el botón principal) sobre el papel, y la tinta para
 * todo lo que se lee. Los nombres `brand*` se mantienen para que, cuando haya
 * un color, cambie solo este archivo.
 */

export const PALETTE = {
  /** Blanco de la marca: el texto y la luz sobre superficies oscuras. */
  white: '#F4F4F4',
  /** Negro de la marca: el texto. */
  black: '#111111',
  /** Fondo de la página: blanco puro. */
  paper: '#FFFFFF',
  /** Texto principal. */
  ink: '#111111',
  /** Texto secundario: el negro al ~65 % sobre el papel (6.2:1). */
  muted: '#5C6166',
  /**
   * Brand (provisorio): el blanco. Es el mismo blanco puro del papel, así que
   * una superficie de la marca se separa con vidrio, borde o sombra.
   * Botón principal, vidrios destacados, brillos.
   */
  brand: '#FFFFFF',
  /** Texto chico «de la marca» (índices, eyebrows, link activo): la tinta mientras no haya color. */
  brandInk: '#111111',
  /** Variante clara del brand: lentes y medusas, vidrio blanco. */
  brandLight: '#FFFFFF',
  /** Variante profunda: superficies oscuras con el isotipo o iniciales en blanco (avatares, paneles de proyecto). */
  brandDeep: '#1C1E21',
  /** Texto sobre el brand: la tinta. */
  onBrand: '#111111',
} as const

/**
 * Fuentes servidas por el sitio (Lato). En .woff porque troika no lee .woff2,
 * y con el subset latin, que cubre el español: un glifo que falte haría que
 * troika lo busque en su CDN. Lato no tiene 600: el peso intermedio es el 700.
 */
export const FONT = {
  regular: '/fonts/lato-latin-400-normal.woff',
  bold: '/fonts/lato-latin-700-normal.woff',
  black: '/fonts/lato-latin-900-normal.woff',
} as const

export const FONT_FAMILY = "Lato, system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Logo provisorio: imagotipo en negro para el papel, isotipo blanco para las superficies oscuras. */
export const LOGO = {
  /** Isotipo en negro (#1C1C1C), el de la navbar; recortado a su dibujo (viewBox 366 × 416). */
  isotipoNegro: { src: '/brand/isotipo-negro.svg', aspect: 366 / 416 },
  /** Imagotipo a 4× (viewBox 345 × 88): la textura sale nítida con DPR 2. */
  imagotipo: { src: '/brand/imagotipo-negro.svg', aspect: 345 / 88 },
  isotipo: { src: '/brand/isotipo.svg', aspect: 60 / 79 },
  /** Logo completo del pie (isotipo + «tresmedusas»), a 3× (viewBox 258 × 44). */
  completo: { src: '/brand/imagotipo-completo.svg', aspect: 258 / 44 },
  /** Logo de Essentia para el «Powered by» del pie, a 3× (viewBox 137 × 27), en su gris. */
  essentia: { src: '/brand/essentia.svg', aspect: 137 / 27 },
  /** La medusa en «s» del hero, animada (cada trazo cambia de forma en un ciclo; viewBox 490 × 524.85). */
  medusa: { src: '/brand/medusa-s.svg', aspect: 490 / 524.85 },
} as const

/**
 * Figuras e imágenes con estética Linear (ver DESIGN.md): líneas finas en tinta
 * con poca opacidad, grilla apenas visible y un solo acento del brand. Toda
 * figura dibujada en la escena o en SVG sale de estos valores.
 */
export const FIGURE = {
  /** Color de los trazos: la tinta, nunca un gris propio. */
  stroke: PALETTE.ink,
  /** Opacidad de un trazo normal y de uno destacado. */
  strokeOpacity: 0.22,
  strokeStrongOpacity: 0.6,
  /** Grosor del trazo en px CSS; el destacado, para el único elemento que importa. */
  strokeWidth: 1,
  strokeStrongWidth: 1.5,
  /** Grilla o puntos de fondo: se intuye, no se lee. */
  gridOpacity: 0.06,
  gridStep: 24,
  /**
   * El único acento por figura. Sin color de marca definido, el acento es el
   * trazo destacado en tinta; cuando haya color, pasa a `PALETTE.brand`.
   */
  accent: PALETTE.ink,
  /** Relleno de superficies: la tinta casi transparente, sin degradados de color. */
  fillOpacity: 0.03,
  /** Radio de esquina de marcos y tarjetas de imagen. */
  radius: 16,
} as const

/** Regla `:root` con la paleta como variables CSS (`--color-brand-light`), para el `<head>`. */
export const TOKENS_CSS = `:root{${Object.entries(PALETTE)
  .map(([name, value]) => `--color-${name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}:${value}`)
  .join(';')};--font-sans:${FONT_FAMILY}}`
