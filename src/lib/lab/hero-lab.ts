import type { FigureLook } from '$lib/scene/figures/hero.js'
import type { HeadlineTiming } from '$lib/scene/headline.js'
import type { HeroLook } from '$lib/scene/hero-look.js'
import { formatConst, rounded, type ControlGroup } from './warp-lab.js'

/**
 * Banco de pruebas del hero de la home (solo en desarrollo): qué se puede
 * ajustar del titular, las separaciones, la rotación y la figura, y cómo se
 * copia a `hero-look.ts`, `headline.ts` y `figures/hero.ts`. El botón tiene
 * su propio banco (`prism-lab*`).
 */

export const HERO_CONTROLS: readonly ControlGroup<keyof HeroLook>[] = [
  {
    title: 'Titular',
    controls: [
      { key: 'textMax', label: 'Ancho máximo en escritorio (px)', min: 480, max: 1080, step: 10, hint: 'El tamaño es el que deja entrar la línea más larga en este ancho, con los topes de abajo.' },
      { key: 'sizeFraction', label: 'Tamaño (fracción de la columna)', min: 0.03, max: 0.12, step: 0.005 },
      { key: 'sizeMin', label: 'Tamaño mínimo (px)', min: 24, max: 96, step: 1 },
      { key: 'sizeMax', label: 'Tamaño máximo (px)', min: 40, max: 140, step: 1 },
      { key: 'compactSizeFraction', label: 'Teléfono: tamaño (fracción del ancho)', min: 0.06, max: 0.2, step: 0.005 },
      { key: 'compactSizeMax', label: 'Teléfono: tamaño máximo (px)', min: 24, max: 72, step: 1 },
      { key: 'tracking', label: 'Letras apretadas (em)', min: 0, max: 0.06, step: 0.002 },
      { key: 'wordSpace', label: 'Espacio entre palabras (em)', min: 0.1, max: 0.5, step: 0.01 },
      { key: 'ease', label: 'Las palabras se acomodan (por s)', min: 1, max: 30, step: 0.5, hint: 'Más, más rápido.' },
    ],
  },
  {
    title: 'Separaciones',
    controls: [
      { key: 'gap', label: 'Titular → botón (px)', min: 0, max: 120, step: 1 },
      { key: 'compactGap', label: 'Teléfono: titular → botón (px)', min: 0, max: 80, step: 1 },
      { key: 'spareAbove', label: 'Aire que sobra: parte de arriba', min: 0, max: 1, step: 0.01, hint: '1: todo arriba del titular; 0: todo entre el botón y la figura.' },
    ],
  },
  {
    title: 'Lugar de la figura',
    controls: [
      { key: 'figureMax', label: 'Ancho máximo (px)', min: 300, max: 1600, step: 10 },
      { key: 'figureGap', label: 'Botón → figura, mínimo (px)', min: 0, max: 160, step: 1 },
      { key: 'figureMinHeight', label: 'No se muestra por debajo de (px)', min: 0, max: 400, step: 5 },
    ],
  },
]

export const TIMING_CONTROLS: readonly ControlGroup<keyof HeadlineTiming>[] = [
  {
    title: 'Rotación del titular',
    controls: [
      { key: 'hold', label: 'Cada combinación se queda (s)', min: 0.3, max: 8, step: 0.1 },
      { key: 'fadeOut', label: 'Fundido de salida (s)', min: 0.05, max: 2, step: 0.05 },
      { key: 'fadeIn', label: 'Fundido de entrada (s)', min: 0.05, max: 2, step: 0.05, hint: 'Los mismos tiempos rigen el título del showcase (ahí se ven recién al pegarlos).' },
    ],
  },
]

export const FIGURE_CONTROLS: readonly ControlGroup<keyof FigureLook>[] = [
  {
    title: 'Figura',
    controls: [
      { key: 'height', label: 'Alto del marco (fracción de su ancho)', min: 0.2, max: 0.8, step: 0.01 },
      { key: 'scale', label: 'Escala de la placa', min: 0.5, max: 3, step: 0.01 },
      { key: 'offsetY', label: 'Placa hacia abajo (px de diseño)', min: -80, max: 80, step: 1 },
      { key: 'edgeFade', label: 'Fundido de los bordes (px)', min: 0, max: 120, step: 1 },
      { key: 'bottomFade', label: 'Difuminado de abajo (fracción del alto)', min: 0, max: 1, step: 0.01 },
      { key: 'bottomCurve', label: 'Curva del difuminado', min: 0.2, max: 6, step: 0.05, hint: 'Más, más concentrado abajo.' },
    ],
  },
  {
    title: 'Cambio de figura (panel de vidrio)',
    controls: [
      { key: 'panelWidth', label: 'Ancho del panel (px de diseño)', min: 10, max: 200, step: 1 },
      { key: 'wipe', label: 'Tarda en cruzar (s)', min: 0.2, max: 3, step: 0.05, hint: 'Si pasa de lo que dura un paso del titular, se corta.' },
      { key: 'glass', label: 'Intensidad del vidrio', min: 0, max: 1, step: 0.01 },
    ],
  },
]

/** El look de la figura como código para pegar en `figures/hero.ts` (ahí va `as const` y sin tipo). */
export function formatFigureLook(look: FigureLook): string {
  const lines = Object.entries(look).map(([key, value]) => `  ${key}: ${rounded(FIGURE_CONTROLS, key, value)},`)
  return `export const LOOK = {\n${lines.join('\n')}\n} as const;\n`
}

/** Todo el hero como código, un bloque por archivo. */
export function formatHero(look: HeroLook, timing: HeadlineTiming, figure: FigureLook): { file: string; code: string }[] {
  return [
    { file: 'hero-look.ts', code: formatConst('HERO_LOOK', 'HeroLook', look, HERO_CONTROLS) },
    { file: 'headline.ts', code: formatConst('HEADLINE_TIMING', 'HeadlineTiming', timing, TIMING_CONTROLS) },
    { file: 'figures/hero.ts', code: formatFigureLook(figure) },
  ]
}
