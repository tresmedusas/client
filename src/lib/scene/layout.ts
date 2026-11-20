/**
 * Medidas y layout de la escena, como funciones puras (testeables sin GPU).
 *
 * Coordenadas: la cámara es 1:1 (1 unidad = 1 px CSS), el origen está en el
 * centro de la ventana y la y crece hacia arriba. Dentro de una sección, el
 * origen es su esquina de arriba a la izquierda y el contenido baja con y
 * negativa.
 */

/** Ancho máximo de la columna de contenido. */
export const MAX_COLUMN = 1080
/** Por debajo de este ancho de ventana el layout pasa a una columna. */
export const COMPACT_BELOW = 760
/** Alto de la navbar fija más su margen: lo que tapa abajo. */
export const NAV_SPACE = 88
/** Margen de arriba de cada escena (la navbar va abajo). */
export const SCENE_TOP = 40

/** Aire entre el contenido de la última escena y el pie. */
export const FOOTER_GAP = 72

/**
 * Alto de las dos franjas del pie (sin contar la de la navbar): la blanca, con
 * el logo, y la de abajo, con «Powered by», el copyright y los términos. En
 * una columna, la de abajo apila sus dos filas.
 */
export function footerBands(compact: boolean): { top: number; bottom: number } {
  return compact ? { top: 104, bottom: 96 } : { top: 140, bottom: 64 }
}

/**
 * Lo que la última escena reserva bajo su contenido para el pie. La franja de
 * la navbar ya queda fuera del área de la escena: el pie la cubre con su
 * franja de abajo, y la navbar flota encima.
 */
export function footerReserve(compact: boolean): number {
  const { top, bottom } = footerBands(compact)
  return FOOTER_GAP + top + bottom
}

/**
 * Tope del pie, en la y de la escena (origen en el tope de su contenido, y
 * hacia arriba): pegado sobre la navbar, con la franja de abajo hasta el
 * borde de la ventana, o `FOOTER_GAP` bajo el contenido si este no entra.
 * `contentBottom` es el borde de abajo del contenido (negativo) y `frameTop`,
 * dónde quedó el tope del contenido en la ventana.
 */
export function footerTop(contentBottom: number, frameTop: number, viewportHeight: number, compact: boolean): number {
  const { top, bottom } = footerBands(compact)
  return Math.min(frameTop - viewportHeight + NAV_SPACE + top + bottom, contentBottom - FOOTER_GAP)
}

/** Alto de los botones (píldoras de vidrio). */
export const CTA_HEIGHT = 52
/** Separación entre dos botones en fila. */
export const CTA_GAP = 12

export const isCompact = (vw: number) => vw < COMPACT_BELOW

/** Margen lateral de la columna: 16 px en un teléfono, 40 px en escritorio. */
export const gutter = (vw: number) => (isCompact(vw) ? 16 : 40)

/** Ancho de la columna de contenido para una ventana de `vw`. */
export function columnWidth(vw: number): number {
  return Math.max(240, Math.min(MAX_COLUMN, vw - gutter(vw) * 2))
}

/**
 * Tope de cada sección (distancia desde el tope de la página, hacia abajo) y
 * alto total, a partir de los altos medidos.
 */
export function stack(heights: readonly number[], gap: number): { tops: number[]; total: number } {
  const tops: number[] = []
  let y = 0
  heights.forEach((height, i) => {
    tops.push(y)
    y += height + (i < heights.length - 1 ? gap : 0)
  })
  return { tops, total: y }
}

export interface Grid {
  columns: number
  cellWidth: number
  /** Centro x de cada celda, desde el borde izquierdo de la grilla. */
  x: (index: number) => number
}

/** Grilla de `columns` columnas iguales en `width`, separadas por `gap`. */
export function grid(width: number, columns: number, gap: number): Grid {
  const cellWidth = (width - gap * (columns - 1)) / columns
  return { columns, cellWidth, x: (i) => (i % columns) * (cellWidth + gap) + cellWidth / 2 }
}

/**
 * Altos de fila de una grilla: cada fila mide lo que su celda más alta.
 * Devuelve el tope de cada fila y el alto total.
 */
export function rows(cellHeights: readonly number[], columns: number, gap: number): { tops: number[]; heights: number[]; total: number } {
  const heights: number[] = []
  cellHeights.forEach((h, i) => {
    const row = Math.floor(i / columns)
    heights[row] = Math.max(heights[row] ?? 0, h)
  })
  const { tops, total } = stack(heights, gap)
  return { tops, heights, total }
}

/** Proporción del dibujo de la medusa del hero (`static/brand/medusa.svg`, 687 × 1030). */
export const MEDUSA_ASPECT = 687 / 1030

/** Cuántas medusas dibuja el fondo (igual que MEDUSA_COUNT en `backdrop.frag.glsl`). */
export const MEDUSA_COUNT = 3

/** Una medusa del hero en pantalla, para el fondo que la dibuja. */
export interface MedusaRect {
  /** Centro en píxeles CSS, con el origen en el centro de la ventana y la y hacia arriba. */
  x: number
  y: number
  width: number
  height: number
  /** Adelanto de su reloj, en segundos: cada una late y nada a su ritmo. */
  phase: number
  /** Opacidad relativa (1 = la principal); las lejanas, más tenues. */
  opacity: number
  /** Dibujo espejado, para que no parezcan copias. */
  mirror: boolean
  /** Cuánto se va con el hero al pasar de escena (las lejanas, menos). */
  parallax: number
}

/** Medidas del hero: el texto arriba y la medusa debajo (la navbar flota abajo, sobre los tentáculos). */
export interface HeroLayout {
  titleSize: number
  leadSize: number
  /** Separación título → bajada y bajada → botón. */
  gaps: [number, number]
  /** Borde de arriba del título, desde el tope de la ventana. */
  textTop: number
  /** Borde de abajo del botón (estimado: el título y la bajada van en una línea). */
  textBottom: number
  /** De atrás hacia adelante: las dos acompañantes y la principal, al final. */
  medusas: MedusaRect[]
}

export const TITLE_LINE = 1.0
export const LEAD_LINE = 1.35

/**
 * Para una columna de `width` en una ventana de `vh` de alto. El texto va
 * centrado arriba; la campana de la medusa empieza justo debajo del botón y
 * los tentáculos salen por el borde de abajo de la ventana.
 */
/** Ancho medio de un carácter de Lato Black, en em (con el interletrado del display). */
const TITLE_CHAR = 0.56

/**
 * Texto arriba y medusa debajo. `title` puede traer saltos de línea: cada
 * línea tiene que entrar entera en el ancho, así que el tamaño baja si hace falta.
 */
export function heroLayout(width: number, vh: number, compact: boolean, title: string): HeroLayout {
  const lines = title.split('\n')
  const longest = Math.max(...lines.map((line) => line.length))
  const fit = width / (longest * TITLE_CHAR)
  const titleSize = Math.min(fit, compact ? Math.min(46, width * 0.12) : Math.max(48, Math.min(72, width * 0.066)))
  const leadSize = compact ? 17 : 20
  const gaps: [number, number] = compact ? [10, 24] : [14, 30]
  // En móvil la bajada va en una medida corta (ver `hero.svelte`): dos líneas.
  const leadLines = compact ? 2 : 1
  // La navbar va abajo: arriba solo el margen de la escena y algo de aire.
  const textTop = SCENE_TOP + vh * (compact ? 0.06 : 0.1)
  const textBottom = textTop + titleSize * TITLE_LINE * lines.length + gaps[0] + leadSize * LEAD_LINE * leadLines + gaps[1] + CTA_HEIGHT

  // La campana ocupa del 8 % al 45 % del dibujo. Es lo bastante grande para
  // que la campana y el arranque de los tentáculos llenen lo que queda abajo.
  // Con margen para lo que sube al nadar (ver `bob`).
  const bellTop = textBottom + (compact ? 20 : 28) + vh * 0.035
  const below = Math.max(vh - bellTop, vh * 0.35)
  const height = Math.min(below * 1.75, (width * (compact ? 1.75 : 0.85)) / MEDUSA_ASPECT)
  // Una medusa de `size` (fracción de la principal) con la campana `drop`
  // más abajo que la principal, corrida `x` desde el centro.
  const place = (x: number, size: number, drop: number, look: Omit<MedusaRect, 'x' | 'y' | 'width' | 'height'>): MedusaRect => {
    const h = height * size
    const t = bellTop + drop - h * 0.08
    return { x, y: vh / 2 - t - h / 2, width: h * MEDUSA_ASPECT, height: h, ...look }
  }
  // Las acompañantes, más chicas (más lejos), a los costados de la principal
  // y más abajo, para no tocar el texto.
  const side = compact ? 0.44 : 0.38
  return {
    titleSize,
    leadSize,
    gaps,
    textTop,
    textBottom,
    medusas: [
      place(-width * side, compact ? 0.3 : 0.48, vh * (compact ? 0.16 : 0.1), { phase: 1.7, opacity: 1, mirror: true, parallax: 0.9 }),
      place(width * (side + 0.02), compact ? 0.24 : 0.38, vh * (compact ? 0.06 : 0.03), { phase: 3.1, opacity: 0.95, mirror: false, parallax: 0.75 }),
      place(0, 1, 0, { phase: 0, opacity: 1, mirror: false, parallax: 1.15 }),
    ],
  }
}

/** Segundos de un pulso de nado de la medusa (igual que en `backdrop.frag.glsl`). */
export const PULSE_PERIOD = 4.5

/**
 * Desplazamiento de la medusa de `height` de alto a los `time` segundos. Lo
 * que manda es una deriva lenta, arriba y abajo y de costado; cada pulso de
 * la campana solo le suma un empujón suave, para que avance sin rebotar.
 */
export function bob(height: number, time: number): { dx: number; dy: number } {
  const phase = (time * Math.PI * 2) / PULSE_PERIOD
  return {
    dx: Math.sin(time * 0.13 + 1.3) * height * 0.016,
    dy: (Math.sin(time * 0.17) * 0.024 + Math.sin(phase - 1.4) * 0.008) * height,
  }
}

/**
 * Acomoda en filas cajas de ancho `widths` dentro de `maxWidth`, como texto:
 * cada una a la derecha de la anterior y, si no entra, en la fila siguiente.
 * Devuelve el borde izquierdo y la fila de cada caja, y la cantidad de filas.
 * Con `align: 'center'` cada fila queda centrada en `maxWidth` (DESIGN.md §6).
 */
export function flow(
  widths: readonly number[],
  maxWidth: number,
  gap: number,
  align: 'start' | 'center' = 'start',
): { x: number[]; row: number[]; rows: number } {
  const x: number[] = []
  const row: number[] = []
  /** Ancho ocupado por cada fila, para centrarla. */
  const used: number[] = []
  let cursor = 0
  let line = 0
  widths.forEach((w, i) => {
    if (i > 0 && cursor + w > maxWidth) {
      line += 1
      cursor = 0
    }
    x.push(cursor)
    row.push(line)
    used[line] = cursor + w
    cursor += w + gap
  })
  if (align === 'center') x.forEach((left, i) => (x[i] = left + (maxWidth - used[row[i]!]!) / 2))
  return { x, row, rows: widths.length === 0 ? 0 : line + 1 }
}
