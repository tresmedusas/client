/**
 * El look de «Cómo trabajamos» (`how-work.svelte`): cómo pasa de una etapa a
 * la otra y cómo se ven las figuras. Los valores de fábrica son los que eligió
 * el usuario; el banco de pruebas (`src/lib/lab/how-lab*`, solo en desarrollo) los ajusta
 * en vivo y copia el resultado para pegar acá.
 */

/**
 * Cómo pasa de una etapa a la otra:
 * - `flow`: una debajo de la otra, de corrido, con un fundido al entrar.
 * - `stack`: cada etapa es una hoja del alto de la ventana; la siguiente sube
 *   desde abajo y la tapa, y la de atrás se hunde bajo un velo de tinta.
 * - `glass`: como `stack`, pero la hoja que sube es de vidrio esmerilado: deja
 *   ver la anterior desenfocada y se vuelve papel al llegar arriba.
 */
export type SheetMode = 'flow' | 'stack' | 'glass'

export const SHEET_MODES: readonly { mode: SheetMode; label: string }[] = [
  { mode: 'flow', label: 'De corrido' },
  { mode: 'stack', label: 'Hojas apiladas' },
  { mode: 'glass', label: 'Hojas de vidrio' },
]

/**
 * Detrás de la figura:
 * - `none`: el papel.
 * - `light`: una placa blanca con borde de tinta al 8 % y sombra suave.
 * - `dark`: una placa `brandDeep`; la figura se dibuja en blanco sobre ella.
 */
export type FigurePlate = 'none' | 'light' | 'dark'

export const FIGURE_PLATES: readonly { plate: FigurePlate; label: string }[] = [
  { plate: 'none', label: 'Sin placa' },
  { plate: 'light', label: 'Placa blanca con sombra' },
  { plate: 'dark', label: 'Placa oscura (figura en blanco)' },
]

export interface HowWorkLook {
  // ── Hojas ──
  /** Pausa con la hoja quieta antes de que suba la siguiente, en fracciones de la ventana. */
  hold: number
  /** Escala a la que se hunde la hoja de atrás cuando la tapa la siguiente. */
  sink: number
  /** Velo de tinta sobre la hoja de atrás, tapada del todo. */
  veil: number
  /** Radio de las esquinas de la hoja, en px. */
  radius: number
  /** Sombra sobre el borde de arriba de la hoja que sube (≤ 0.1). */
  shadow: number
  /** Alcance de esa sombra, en px. */
  shadowSpread: number
  /** Vidrio: blur de lo que queda atrás, en px. */
  glassBlur: number
  /** Vidrio: refracción. */
  glassRefraction: number
  /** Vidrio: tinte de papel al empezar a subir (llega a 1 arriba). */
  glassTint: number

  // ── Figuras ──
  /** Ancho máximo de la figura de corrido, en px. */
  figureMax: number
  /** Alto de la figura en las hojas, en fracciones de la ventana. */
  figureHeight: number
  /** Cuánta tinta llevan los lados de los volúmenes (1 = 5 % y 9 %). */
  ink: number
  /** Opacidad de los trazos normales. */
  stroke: number
  /** Margen de la placa alrededor de la figura, en px. */
  platePad: number
}

/** Los valores que eligió el usuario en el banco de pruebas (2026-11-26). */
export const HOW_LOOK: HowWorkLook = {
  hold: 0.35,
  sink: 0.92,
  veil: 0.005,
  radius: 0,
  shadow: 0.015,
  shadowSpread: 40,
  glassBlur: 14,
  glassRefraction: 0.6,
  glassTint: 0.3,
  figureMax: 800,
  figureHeight: 0.6,
  ink: 1.8,
  stroke: 0.45,
  platePad: 0,
}

export const HOW_SHEETS: SheetMode = 'glass'
export const HOW_PLATE: FigurePlate = 'none'
/** El acento de cada figura es un sólido `brandDeep` (la lupa, la tarea en curso), como la caja de la etapa 2. */
export const HOW_SOLID = true

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export interface SheetState {
  /** La hoja que está arriba, quieta (0 a n − 1). */
  base: number
  /** Cuánto subió la siguiente (0 a 1); 0 si no hay siguiente. */
  rise: number
}

/**
 * Qué hoja se ve con `slide` px de recorrido: cada hoja se queda quieta
 * `hold` px y después la siguiente sube `sheet` px, 1:1 con el scroll.
 */
export function sheetState(slide: number, count: number, sheet: number, hold: number): SheetState {
  if (count <= 1 || sheet <= 0) return { base: 0, rise: 0 }
  const segment = sheet + hold
  const j = Math.floor(Math.max(0, slide) / segment)
  if (j >= count - 1) return { base: count - 1, rise: 0 }
  const rise = clamp01((slide - j * segment - hold) / sheet)
  return rise >= 1 ? { base: j + 1, rise: 0 } : { base: j, rise }
}

/** El recorrido de las hojas: una pausa y una subida por cada hoja que sigue, y la pausa de la última. */
export function sheetTrack(count: number, sheet: number, hold: number): number {
  return count <= 1 ? 0 : (count - 1) * (sheet + hold) + hold
}
