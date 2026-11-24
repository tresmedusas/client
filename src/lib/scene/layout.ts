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

/** Una medusa del hero, en el espacio de la columna (origen arriba a la izquierda, bajo el tope de la ventana). */
export interface Medusa {
  x: number
  y: number
  width: number
  height: number
  /** Fase propia, para que no se muevan al unísono. */
  phase: number
  /** Color del tinte. */
  tint: 'brand' | 'light'
}

/**
 * Dónde flotan las tres medusas del hero, para una ventana de `heroHeight` de
 * alto. En escritorio, a la derecha del título y sobre su final (el vidrio
 * refracta las letras); en una columna, arriba a la derecha, más chicas.
 */
export function medusas(width: number, heroHeight: number, compact: boolean): Medusa[] {
  if (compact) {
    const s = Math.min(1, width / 420)
    return [
      { x: width - 70 * s, y: -SCENE_TOP - 40 * s, width: 110 * s, height: 86 * s, phase: 0, tint: 'light' },
      { x: width - 170 * s, y: -SCENE_TOP - 10 * s, width: 70 * s, height: 56 * s, phase: 2.1, tint: 'brand' },
      { x: width - 30 * s, y: -SCENE_TOP - 150 * s, width: 56 * s, height: 44 * s, phase: 4.2, tint: 'brand' },
    ]
  }
  const s = Math.min(1.15, Math.max(0.75, heroHeight / 820))
  return [
    { x: width * 0.8, y: -heroHeight * 0.3, width: 240 * s, height: 190 * s, phase: 0, tint: 'light' },
    { x: width * 0.7, y: -heroHeight * 0.6, width: 150 * s, height: 118 * s, phase: 2.1, tint: 'brand' },
    { x: width * 0.95, y: -heroHeight * 0.66, width: 100 * s, height: 80 * s, phase: 4.2, tint: 'brand' },
  ]
}

/** Una medusa en pantalla, para el fondo (su brillo y sus tentáculos). */
export interface MedusaRect {
  /** Centro en píxeles CSS, con el origen en el centro de la ventana y la y hacia arriba. */
  x: number
  y: number
  width: number
  height: number
  color: string
}

/** Desplazamiento de flotación de una medusa a los `time` segundos. */
export function bob(medusa: Medusa, time: number): { dx: number; dy: number } {
  const amp = medusa.height * 0.08
  return {
    dx: Math.sin(time * 0.31 + medusa.phase * 1.7) * amp * 0.6,
    dy: Math.sin(time * 0.62 + medusa.phase) * amp,
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
