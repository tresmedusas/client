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

/** Un rectángulo por su centro, en píxeles CSS. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Medidas del hero: una columna centrada con el logo arriba y el texto (título, bajada y botón) debajo. */
export interface HeroLayout {
  titleSize: number
  leadSize: number
  /** Separación título → bajada y bajada → botón. */
  gaps: [number, number]
  /** Ancho máximo del texto, centrado en la columna. */
  textWidth: number
  /** Borde de arriba del título, desde el tope de la ventana. */
  textTop: number
  /** El logo: x desde el borde izquierdo de la columna, y desde el tope de la ventana. */
  logo: Box
}

export const TITLE_LINE = 1.0
export const LEAD_LINE = 1.35

/** Ancho medio de un carácter de Lato Black, en em (con el interletrado del display). */
const TITLE_CHAR = 0.56

/** Ancho máximo del texto del hero en escritorio: la bajada centrada se lee corta. */
const HERO_TEXT_MAX = 720

/**
 * Para una columna de `width` en una ventana de `vh` de alto. `logoAspect`
 * es ancho / alto del logo. `textHeight` es el alto medido del bloque de
 * texto (título, bajada y botón); mientras no se mide, se estima.
 *
 * Todo va centrado en la columna: el logo arriba y el texto debajo. El
 * bloque entero (logo, separación y texto) queda centrado en el alto libre,
 * entre el margen de arriba y la navbar.
 */
export function heroLayout(width: number, vh: number, compact: boolean, title: string, logoAspect: number, textHeight?: number): HeroLayout {
  const textWidth = compact ? width : Math.min(width, HERO_TEXT_MAX)
  const fit = textWidth / (title.length * TITLE_CHAR)
  const titleSize = Math.min(fit, compact ? Math.min(44, width * 0.12) : Math.max(48, Math.min(64, width * 0.06)))
  const leadSize = compact ? 18 : 22
  const gaps: [number, number] = compact ? [10, 24] : [12, 28]
  const block = textHeight ?? titleSize * TITLE_LINE + gaps[0] + leadSize * LEAD_LINE * (compact ? 2 : 1) + gaps[1] + CTA_HEIGHT

  // Lo que queda libre entre el margen de arriba y la navbar.
  const free = vh - SCENE_TOP - NAV_SPACE
  const height = compact ? Math.min(free * 0.3, width * 0.55) : Math.min(free * 0.26, width * 0.3)
  const gap = compact ? 28 : 40
  const top = SCENE_TOP + Math.max(0, (free - height - gap - block) / 2)
  return {
    titleSize,
    leadSize,
    gaps,
    textWidth,
    textTop: top + height + gap,
    logo: { x: width / 2, y: top + height / 2, width: height * logoAspect, height },
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
