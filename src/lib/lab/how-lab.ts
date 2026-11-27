import type { FigurePlate, HowWorkLook, SheetMode } from '$lib/scene/how-work-look.js'
import { formatConst, type ControlGroup } from './warp-lab.js'

/**
 * Banco de pruebas de «Cómo trabajamos» (solo en desarrollo): qué se puede
 * ajustar de las hojas y de las figuras, y cómo se copia a `how-work-look.ts`.
 */

export const SHEET_CONTROLS: readonly ControlGroup<keyof HowWorkLook>[] = [
  {
    title: 'Hojas',
    controls: [
      { key: 'hold', label: 'Pausa antes de la siguiente (fracción de la ventana)', min: 0, max: 1.5, step: 0.05, hint: 'Cuánto scroll queda quieta cada hoja, para leerla.' },
      { key: 'sink', label: 'La de atrás se hunde hasta (escala)', min: 0.8, max: 1, step: 0.005 },
      { key: 'veil', label: 'Velo de tinta sobre la de atrás', min: 0, max: 0.3, step: 0.005 },
      { key: 'radius', label: 'Radio de la hoja (px)', min: 0, max: 64, step: 1 },
      { key: 'shadow', label: 'Sombra de la hoja que sube', min: 0, max: 0.2, step: 0.005, hint: 'DESIGN.md §5: 0.1 como mucho.' },
      { key: 'shadowSpread', label: 'Alcance de la sombra (px)', min: 0, max: 120, step: 1 },
    ],
  },
  {
    title: 'Hojas de vidrio',
    controls: [
      { key: 'glassBlur', label: 'Blur de lo de atrás (px)', min: 0, max: 29, step: 0.5 },
      { key: 'glassRefraction', label: 'Refracción', min: 0, max: 2, step: 0.05 },
      { key: 'glassTint', label: 'Papel al empezar a subir', min: 0, max: 1, step: 0.01, hint: 'Llega a 1 (papel) cuando la hoja termina de subir.' },
    ],
  },
]

export const FIGURE_CONTROLS: readonly ControlGroup<keyof HowWorkLook>[] = [
  {
    title: 'Figuras',
    controls: [
      { key: 'figureHeight', label: 'Alto en las hojas (fracción de la ventana)', min: 0.25, max: 0.75, step: 0.01 },
      { key: 'figureMax', label: 'Ancho máximo de corrido (px)', min: 400, max: 1100, step: 10 },
      { key: 'ink', label: 'Tinta de los volúmenes (× 5 % y 9 %)', min: 0.5, max: 3, step: 0.05 },
      { key: 'stroke', label: 'Opacidad de los trazos', min: 0.1, max: 0.6, step: 0.01, hint: 'De fábrica, 0.45 (el resto de las figuras, 0.22).' },
      { key: 'platePad', label: 'Margen de la placa (px)', min: -80, max: 80, step: 1, hint: 'Negativo: la placa queda más chica que el marco.' },
    ],
  },
]

export const HOW_GROUPS = [...SHEET_CONTROLS, ...FIGURE_CONTROLS]

/** Todo el look como código para pegar en `how-work-look.ts`. */
export function formatHowLook(look: HowWorkLook, sheets: SheetMode, plate: FigurePlate, solid: boolean): string {
  return (
    formatConst('HOW_LOOK', 'HowWorkLook', look, HOW_GROUPS) +
    `\nexport const HOW_SHEETS: SheetMode = '${sheets}'\n` +
    `export const HOW_PLATE: FigurePlate = '${plate}'\n` +
    `export const HOW_SOLID = ${solid}\n`
  )
}
