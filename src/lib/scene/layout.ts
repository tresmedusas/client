/**
 * Medidas y layout de la escena, como funciones puras (testeables sin GPU).
 *
 * Coordenadas: la cámara es 1:1 (1 unidad = 1 px CSS), el origen está en el
 * centro de la ventana y la y crece hacia arriba. Dentro de una sección, el
 * origen es su esquina de arriba a la izquierda y el contenido baja con y
 * negativa.
 */

import { bandHeight, type WarpLook } from './edge-warp.js'
import { ASPECT as FIGURE_ASPECT } from './figures/hero.js'

/** Ancho máximo de la columna de contenido. */
export const MAX_COLUMN = 1080
/** Por debajo de este ancho de ventana el layout pasa a una columna. */
export const COMPACT_BELOW = 760
/** Alto de la navbar fija más su margen: lo que tapa arriba. */
export const NAV_SPACE = 88
/** Margen de abajo de cada escena (la navbar va arriba). */
export const SCENE_BOTTOM = 40

/** Aire entre el contenido de la última escena y el pie. */
export const FOOTER_GAP = 72

/**
 * Alto de las dos franjas del pie (sin contar el margen de abajo): la blanca, con
 * el logo, y la de abajo, con «Powered by», el copyright y los términos. En
 * una columna, la de abajo apila sus dos filas.
 */
export function footerBands(compact: boolean): { top: number; bottom: number } {
  return compact ? { top: 104, bottom: 96 } : { top: 140, bottom: 64 }
}

/**
 * Lo que la última escena reserva bajo su contenido para el pie. El margen de
 * abajo (`SCENE_BOTTOM`) ya queda fuera del área de la escena: el pie lo cubre
 * con su franja de abajo.
 */
export function footerReserve(compact: boolean): number {
  const { top, bottom } = footerBands(compact)
  return FOOTER_GAP + top + bottom
}

/**
 * Tope del pie, en la y de la escena (origen en el tope de su contenido, y
 * hacia arriba): pegado abajo, con la franja de abajo hasta el borde de la
 * ventana, o `FOOTER_GAP` bajo el contenido si este no entra.
 * `contentBottom` es el borde de abajo del contenido (negativo) y `frameTop`,
 * dónde quedó el tope del contenido en la ventana.
 */
export function footerTop(contentBottom: number, frameTop: number, viewportHeight: number, compact: boolean): number {
  const { top, bottom } = footerBands(compact)
  return Math.min(frameTop - viewportHeight + SCENE_BOTTOM + top + bottom, contentBottom - FOOTER_GAP)
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

/** Medidas del hero: el titular y el botón, centrados en la columna, y la figura debajo, hasta el borde de abajo de la ventana. */
export interface HeroLayout {
  titleSize: number
  /** Ancho máximo del titular, centrado en la columna. */
  textWidth: number
  /** Borde de arriba del titular, desde el tope de la ventana. */
  textTop: number
  /** Separación titular → botón. */
  gap: number
  /** Ancho y alto del marco de la figura, debajo del botón y hasta el borde de abajo de la ventana; 0 si no entra. */
  figureWidth: number
  figureHeight: number
  /** Separación botón → marco de la figura. */
  figureGap: number
}

export const TITLE_LINE = 1.0
export const LEAD_LINE = 1.35

/** Ancho medio de un carácter de Lato Black, en em (con el interletrado del display). */
const TITLE_CHAR = 0.56

/** Ancho máximo del titular del hero en escritorio: el protagonista, en dos líneas. */
const HERO_TEXT_MAX = 960

/**
 * La figura del hero (su alto natural sale de `figures/hero.ts`): ancho
 * máximo del marco, el alto por debajo del cual no se muestra, la separación
 * mínima desde el botón y qué parte del alto que sobra va arriba del titular
 * (el resto, entre el botón y la figura).
 */
const HERO_FIGURE_MAX = 1100
const HERO_FIGURE_MIN_HEIGHT = 120
const HERO_FIGURE_GAP = 28
const HERO_SPARE_ABOVE = 0.65

/**
 * Para una columna de `width` en una ventana de `vh` de alto. `title` es el
 * titular más ancho que se va a mostrar, con sus cortes de línea (`\n`).
 * `textHeight` es el alto del titular; mientras no se mide, se estima.
 *
 * En escritorio el titular toma el tamaño con el que su línea más larga
 * entra en el ancho; en una columna, el que deja entrar su palabra más larga,
 * y las líneas se parten. Debajo del botón va la figura, tan ancha como la
 * columna (hasta su máximo) y pegada al borde de abajo de la ventana: con su
 * alto natural si entra y, si no, recortada por abajo, donde igual se
 * difumina (y nada si queda muy baja). Lo que sobra se reparte entre arriba
 * del titular y entre el botón y la figura. Sin figura, el titular y el botón
 * quedan centrados en el alto libre, entre la navbar y el margen de abajo.
 */
export function heroLayout(width: number, vh: number, compact: boolean, title: string, textHeight?: number): HeroLayout {
  const textWidth = compact ? width : Math.min(width, HERO_TEXT_MAX)
  const lines = title.split('\n')
  const longest = (parts: string[]) => Math.max(...parts.map((p) => p.length))
  const fit = textWidth / ((compact ? longest(title.split(/\s+/)) : longest(lines)) * TITLE_CHAR)
  const cap = compact ? Math.min(44, width * 0.12) : Math.max(48, Math.min(80, width * 0.07))
  const titleSize = Math.min(fit, cap)
  // Cada línea fija ocupa las líneas que necesite a ese tamaño.
  const rows = lines.reduce((n, line) => n + Math.max(1, Math.ceil((line.length * TITLE_CHAR * titleSize) / textWidth)), 0)
  const gap = compact ? 28 : 40
  const text = (textHeight ?? titleSize * TITLE_LINE * rows) + gap + CTA_HEIGHT

  // La figura llega hasta el borde de abajo de la ventana (pasa el margen de abajo).
  const figureWidth = Math.floor(Math.min(HERO_FIGURE_MAX, width))
  const below = vh - NAV_SPACE - text - HERO_FIGURE_GAP
  const figureHeight = Math.min(Math.floor(figureWidth / FIGURE_ASPECT), below)
  if (figureHeight >= HERO_FIGURE_MIN_HEIGHT) {
    const spare = below - figureHeight
    return {
      titleSize,
      textWidth,
      textTop: NAV_SPACE + spare * HERO_SPARE_ABOVE,
      gap,
      figureWidth,
      figureHeight,
      figureGap: HERO_FIGURE_GAP + spare * (1 - HERO_SPARE_ABOVE),
    }
  }

  // Sin figura: el titular y el botón, centrados entre la navbar y el margen de abajo.
  const free = vh - NAV_SPACE - SCENE_BOTTOM
  return { titleSize, textWidth, textTop: NAV_SPACE + Math.max(0, (free - text) / 2), gap, figureWidth: 0, figureHeight: 0, figureGap: HERO_FIGURE_GAP }
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

/**
 * Tamaño de las cards del showcase (pedido del usuario, 2026-11-25: más
 * anchas). Se ajusta con el banco de pruebas (`src/lib/lab/`).
 */
export interface CaseLook {
  /** Proporción ancho / alto en escritorio (1.5 = 3:2) y en un teléfono. */
  aspect: number
  compactAspect: number
  /** Ancho máximo en escritorio (px), y como mucho esta fracción de la ventana. */
  maxWidth: number
  maxFraction: number
  /** Ancho máximo en un teléfono, como fracción de la ventana. */
  compactFraction: number
  /** Separación entre cards (px), en escritorio y en un teléfono. */
  gap: number
  compactGap: number
  /** Al entrar, a qué altura de la ventana arrancan las cards (fracción): arriba, el título. */
  start: number
}

/**
 * Apaisadas en escritorio (3:2); 4:5 en un teléfono. Al entrar arrancan al
 * 62 % del alto de la ventana (unos 100 px más abajo que la mitad, pedido del
 * usuario, 2026-11-25: se ve más el scroll hasta los casos). Tan altas como la
 * ventana una vez que el título se fue (pedido del usuario, 2026-11-25), con
 * tope en 990 px de ancho. Valores ajustados por el usuario en el banco de
 * pruebas (2026-11-25).
 */
export const CASE_LOOK: CaseLook = {
  aspect: 1.5,
  compactAspect: 0.8,
  maxWidth: 990,
  maxFraction: 0.9,
  compactFraction: 0.84,
  gap: 94,
  compactGap: 16,
  start: 0.62,
}

/**
 * Tamaño de la card de un caso del showcase, que pasan en fila de izquierda a
 * derecha (pedido del usuario, 2026-11-25): tan alta como entre en `available`
 * (la ventana entre la navbar y el pie de la escena) con la proporción del
 * look, sin pasar del ancho máximo, y nunca menos de 120 px de alto. La card
 * centrada queda afuera de las franjas de los costados (`band`, con 12 px de
 * aire): solo las vecinas, que asoman por los bordes, se estiran.
 */
export function caseCard(
  viewportWidth: number,
  available: number,
  compact: boolean,
  band = 0,
  look: CaseLook = CASE_LOOK,
): { width: number; height: number } {
  const aspect = compact ? look.compactAspect : look.aspect
  const clear = viewportWidth - 2 * (band + 12)
  const maxWidth = Math.min(clear, compact ? viewportWidth * look.compactFraction : Math.min(look.maxWidth, viewportWidth * look.maxFraction))
  const height = Math.round(Math.max(120, Math.min(available, maxWidth / aspect)))
  return { width: Math.round(height * aspect), height }
}

/**
 * Tamaño de las franjas de los costados del showcase (px), que se ajusta a la
 * ventana (pedido del usuario, 2026-11-25): la card centrada tiene prioridad.
 * Primero se calcula la card con su tope (tan alta como la ventana entre la
 * navbar y el pie de la escena), y las franjas toman lo que queda a cada
 * costado (con 12 px de aire): como mucho el tamaño del look y nunca menos
 * de `minHeight`. Por debajo de ese mínimo, la card se achica (`caseCard`).
 */
export function showcaseBand(look: WarpLook, cases: CaseLook, viewportWidth: number, viewportHeight: number, compact: boolean): number {
  const max = bandHeight(look, viewportWidth, compact)
  const card = caseCard(viewportWidth, viewportHeight - NAV_SPACE - SCENE_BOTTOM, compact, 0, cases)
  const room = (viewportWidth - card.width) / 2 - 12
  return Math.round(Math.max(0, Math.min(look.minHeight, max), Math.min(max, room)))
}

/** Aire mínimo arriba y abajo del título de la entrada del showcase (px). */
export const INTRO_PAD = 24

/**
 * La entrada del showcase, como el hero (pedido del usuario, 2026-11-25): el
 * título va arriba y las cards arrancan a `start` de la ventana, cortadas
 * por el borde de abajo; el scroll sube todo hasta que la card queda
 * centrada entre la navbar y el pie de la escena (y el título se fue).
 * Desde el tope del contenido: `titleTop`, el título, centrado sobre las
 * cards; `cardTop`, las cards; `height`, el alto del contenido, con el aire
 * de abajo que centra la card al final. Con el contenido más alto que la
 * ventana, la escena arranca a `NAV_SPACE + 8` (`sceneFrame`).
 */
export function showcaseIntro(
  viewportHeight: number,
  headHeight: number,
  cardHeight: number,
  start: number,
): { titleTop: number; cardTop: number; height: number } {
  const area = viewportHeight - NAV_SPACE - SCENE_BOTTOM
  const cardTop = Math.round(Math.max(headHeight + 2 * INTRO_PAD, viewportHeight * start - NAV_SPACE - 8))
  const below = Math.max(0, Math.round((area - cardHeight) / 2))
  return { titleTop: Math.round((cardTop - headHeight) / 2), cardTop, height: cardTop + cardHeight + below }
}

/**
 * Recorrido horizontal de la fila de casos (px): de la primera card centrada
 * en la ventana a la última centrada. El scroll de la página lo recorre 1:1.
 */
export function caseTrack(count: number, cardWidth: number, gap: number): number {
  return Math.max(0, count - 1) * (cardWidth + gap)
}
