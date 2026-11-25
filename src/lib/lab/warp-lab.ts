import type { WarpLook } from '$lib/scene/edge-warp.js'

/**
 * Banco de pruebas de los efectos de los bordes (solo en desarrollo): qué se
 * puede ajustar, en qué rango, y cómo se copian los valores a `edge-warp.ts`.
 */

export type LookName = 'home' | 'showcase'

export interface Control {
  key: keyof WarpLook
  label: string
  min: number
  max: number
  step: number
  /** Una aclaración corta, si hace falta. */
  hint?: string
}

export interface ControlGroup {
  title: string
  controls: readonly Control[]
}

export const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    title: 'Franjas de arriba y abajo',
    controls: [
      { key: 'height', label: 'Alto (px)', min: 0, max: 400, step: 1 },
      { key: 'maxFraction', label: 'Alto máximo (fracción de la ventana)', min: 0, max: 0.5, step: 0.01 },
      { key: 'compactHeight', label: 'Alto en teléfono (px)', min: 0, max: 300, step: 1 },
    ],
  },
  {
    title: 'Deformación',
    controls: [
      { key: 'stretch', label: 'Estirado hacia el borde', min: 0, max: 0.95, step: 0.01, hint: 'Con 0, se usa el cilindro.' },
      { key: 'curve', label: 'Cilindro (rad)', min: 0, max: 1.5, step: 0.01, hint: 'Solo con el estirado en 0.' },
      { key: 'spread', label: 'Apertura a los costados', min: 0, max: 3, step: 0.01 },
      { key: 'aberration', label: 'Aberración (deformación por canal)', min: 0, max: 1, step: 0.01 },
      { key: 'split', label: 'Separación de canales (px)', min: 0, max: 40, step: 0.5 },
      { key: 'blur', label: 'Blur en el borde (px)', min: 0, max: 80, step: 1 },
      { key: 'ripple', label: 'Líquido: amplitud (px)', min: 0, max: 30, step: 0.5 },
      { key: 'wavelength', label: 'Líquido: largo de onda (px)', min: 20, max: 600, step: 5 },
    ],
  },
  {
    title: 'Reflejo de los costados',
    controls: [
      { key: 'reflect', label: 'Fuerza', min: 0, max: 1, step: 0.01, hint: 'Se enciende solo con un caso en el centro: en el showcase.' },
      { key: 'reflectWidth', label: 'Ancho (px)', min: 0, max: 300, step: 1 },
      { key: 'reflectMaxFraction', label: 'Ancho máximo (fracción de la ventana)', min: 0, max: 0.3, step: 0.005 },
      { key: 'reflectSpan', label: 'Medio alto del óvalo (fracción de la ventana)', min: 0, max: 0.5, step: 0.01 },
      { key: 'reflectReach', label: 'Alcance de lo reflejado (px)', min: 0, max: 1000, step: 5 },
      { key: 'reflectBlur', label: 'Blur (px)', min: 0, max: 150, step: 1 },
      { key: 'reflectWiden', label: 'Estirado a lo alto', min: 0.5, max: 3, step: 0.01 },
      { key: 'reflectSaturation', label: 'Saturación extra', min: 0, max: 3, step: 0.05 },
      { key: 'reflectHold', label: 'Entero hasta (fracción de la card)', min: 0, max: 0.5, step: 0.01 },
      { key: 'reflectFade', label: 'Se apaga a lo largo de (fracción de la card)', min: 0.01, max: 1, step: 0.01 },
    ],
  },
]

/** Decimales de un paso: 0.005 → 3. */
export function decimals(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

const CONTROLS = CONTROL_GROUPS.flatMap((group) => group.controls)

/** Un valor redondeado al paso de su control. */
export function rounded(key: keyof WarpLook, value: number): number {
  const control = CONTROLS.find((c) => c.key === key)
  return control ? Number(value.toFixed(decimals(control.step))) : value
}

/** Los valores guardados sobre los de fábrica: solo números de claves conocidas. */
export function mergeLook(defaults: WarpLook, saved: unknown): WarpLook {
  const look = { ...defaults }
  if (!saved || typeof saved !== 'object') return look
  for (const key of Object.keys(defaults) as (keyof WarpLook)[]) {
    const value = (saved as Record<string, unknown>)[key]
    if (typeof value === 'number' && Number.isFinite(value)) look[key] = value
  }
  return look
}

const CONST_NAMES: Record<LookName, string> = { home: 'HOME_WARP', showcase: 'SHOWCASE_WARP' }

/** El look como código para pegar en `edge-warp.ts`. */
export function formatLook(name: LookName, look: WarpLook): string {
  const lines = (Object.keys(look) as (keyof WarpLook)[]).map((key) => `  ${key}: ${rounded(key, look[key])},`)
  return `export const ${CONST_NAMES[name]}: WarpLook = {\n${lines.join('\n')}\n}\n`
}

/** Las claves cuyo valor difiere del de fábrica. */
export function changedKeys(defaults: WarpLook, look: WarpLook): (keyof WarpLook)[] {
  return (Object.keys(defaults) as (keyof WarpLook)[]).filter((key) => rounded(key, look[key]) !== rounded(key, defaults[key]))
}

/** Pares de colores de las previsualizaciones de prueba: para ver el reflejo, que con el papel no se ve. */
const TEST_COLORS: readonly [string, string][] = [
  ['#ff3d8b', '#2f6bff'],
  ['#ffb020', '#00c2a8'],
  ['#7a3dff', '#ff5a36'],
  ['#00a3ff', '#b6ff3d'],
]

/** Una previsualización de prueba de colores, como data URI (no se publica nada en `static/`). */
export function testPreview(index: number): string {
  const [a, b] = TEST_COLORS[index % TEST_COLORS.length]!
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="1200" height="1500">` +
    `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="400" height="500" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
