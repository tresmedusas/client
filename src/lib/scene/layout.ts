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
/** Alto de la navbar fija más su margen: lo que tapa arriba. */
export const NAV_SPACE = 88
/** Separación vertical entre secciones. */
export const SECTION_GAP = 140

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

/** Separación entre secciones según el ancho de la ventana. */
export const sectionGap = (vw: number) => (isCompact(vw) ? 88 : SECTION_GAP)

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

/** Una medusa del hero, en el espacio del hero (origen arriba a la izquierda de la columna). */
export interface Medusa {
  x: number
  y: number
  width: number
  height: number
  /** Fase propia, para que no se muevan al unísono. */
  phase: number
  /** Color del tinte. */
  tint: 'accent' | 'glow'
}

/**
 * Dónde flotan las tres medusas. En escritorio, a la derecha del título y
 * sobre su final (el vidrio refracta las letras); en una columna, arriba a la
 * derecha, más chicas.
 */
export function medusas(width: number, heroHeight: number, compact: boolean): Medusa[] {
  if (compact) {
    const s = Math.min(1, width / 420)
    return [
      { x: width - 70 * s, y: -NAV_SPACE - 40 * s, width: 110 * s, height: 86 * s, phase: 0, tint: 'glow' },
      { x: width - 170 * s, y: -NAV_SPACE - 10 * s, width: 70 * s, height: 56 * s, phase: 2.1, tint: 'accent' },
      { x: width - 30 * s, y: -NAV_SPACE - 150 * s, width: 56 * s, height: 44 * s, phase: 4.2, tint: 'accent' },
    ]
  }
  const s = Math.min(1.15, Math.max(0.75, heroHeight / 820))
  return [
    { x: width * 0.8, y: -heroHeight * 0.3, width: 240 * s, height: 190 * s, phase: 0, tint: 'glow' },
    { x: width * 0.7, y: -heroHeight * 0.6, width: 150 * s, height: 118 * s, phase: 2.1, tint: 'accent' },
    { x: width * 0.95, y: -heroHeight * 0.66, width: 100 * s, height: 80 * s, phase: 4.2, tint: 'accent' },
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
