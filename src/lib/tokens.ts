/**
 * Valores visuales de la landing, sin imports: `+layout.svelte` los publica
 * como variables CSS para el primer paint, y three y troika no pueden entrar a
 * ese JS. La escena los lee de acá también.
 *
 * Identidad: blanco, negro y el azul de la marca, sobre papel blanco con
 * grano. Las variantes del azul (`brandInk`, `brandLight`, `brandDeep`) son
 * provisorias, derivadas del brand hasta que la identidad las defina.
 */

export const PALETTE = {
  /** Blanco de la marca: el fondo (el papel). */
  white: '#F4F4F4',
  /** Negro de la marca: el texto. */
  black: '#111111',
  /** Fondo de la página. */
  paper: '#F4F4F4',
  /** Texto principal. */
  ink: '#111111',
  /** Texto secundario: el negro al ~65 % sobre el papel (5.6:1). */
  muted: '#5C6166',
  /** Azul de la marca: botón principal, marcas, brillos. */
  brand: '#01A3E8',
  /**
   * Variante oscura del brand (provisoria) para texto chico sobre el papel:
   * el brand puro no llega a 3:1 sobre el blanco, este da 5:1.
   */
  brandInk: '#006FA6',
  /** Variante clara del brand (provisoria): la segunda medusa y las lentes. */
  brandLight: '#7CD2F7',
  /** Variante profunda del brand (provisoria): avatares y paneles de proyecto. */
  brandDeep: '#0B4F70',
  /** Texto sobre el brand: el negro (6.5:1; el blanco no llega a 3:1). */
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

/** Logo provisorio: imagotipo en negro para el papel, isotipo blanco para los paneles del brand. */
export const LOGO = {
  /** Imagotipo a 4× (viewBox 345 × 88): la textura sale nítida con DPR 2. */
  imagotipo: { src: '/brand/imagotipo-negro.svg', aspect: 345 / 88 },
  isotipo: { src: '/brand/isotipo.svg', aspect: 60 / 79 },
} as const

/** Regla `:root` con la paleta como variables CSS (`--color-brand-light`), para el `<head>`. */
export const TOKENS_CSS = `:root{${Object.entries(PALETTE)
  .map(([name, value]) => `--color-${name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}:${value}`)
  .join(';')};--font-sans:${FONT_FAMILY}}`
