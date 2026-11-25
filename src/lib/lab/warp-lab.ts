import type { WarpLook } from '$lib/scene/edge-warp.js'
import type { CaseLook } from '$lib/scene/layout.js'

/**
 * Banco de pruebas de los efectos de los bordes y del tamaño de las cards del
 * showcase (solo en desarrollo): qué se puede ajustar, en qué rango, y cómo
 * se copian los valores a `edge-warp.ts` y `layout.ts`.
 */

export type LookName = 'home' | 'showcase'

export interface Control<K extends string = string> {
  key: K
  label: string
  min: number
  max: number
  step: number
  /** Una aclaración corta, si hace falta. */
  hint?: string
}

export interface ControlGroup<K extends string = string> {
  title: string
  controls: readonly Control<K>[]
}

export const CONTROL_GROUPS: readonly ControlGroup<keyof WarpLook>[] = [
  {
    title: 'Franjas (bordes del scroll: costados en el showcase, arriba y abajo en la home)',
    controls: [
      { key: 'height', label: 'Tamaño hacia adentro (px)', min: 0, max: 400, step: 1 },
      { key: 'maxFraction', label: 'Tamaño máximo (fracción de la ventana)', min: 0, max: 0.5, step: 0.01 },
      { key: 'compactHeight', label: 'Tamaño en teléfono (px)', min: 0, max: 300, step: 1 },
      { key: 'minHeight', label: 'Tamaño mínimo (px)', min: 0, max: 300, step: 1, hint: 'En el showcase se achican hasta acá para dejarle lugar a la card centrada.' },
    ],
  },
  {
    title: 'Deformación',
    controls: [
      { key: 'stretch', label: 'Estirado hacia el borde', min: 0, max: 0.95, step: 0.01, hint: 'Con 0, se usa el cilindro.' },
      { key: 'curve', label: 'Cilindro (rad)', min: 0, max: 1.5, step: 0.01, hint: 'Solo con el estirado en 0.' },
      { key: 'spread', label: 'Apertura a lo largo del borde', min: 0, max: 3, step: 0.01 },
      { key: 'aberration', label: 'Aberración (deformación por canal)', min: 0, max: 1, step: 0.01 },
      { key: 'split', label: 'Separación de canales (px)', min: 0, max: 40, step: 0.5 },
      { key: 'blur', label: 'Blur en el borde (px)', min: 0, max: 80, step: 1 },
      { key: 'ripple', label: 'Líquido: amplitud (px)', min: 0, max: 30, step: 0.5 },
      { key: 'wavelength', label: 'Líquido: largo de onda (px)', min: 20, max: 600, step: 5 },
    ],
  },
  {
    title: 'Reflejo (los otros dos bordes: arriba y abajo en el showcase)',
    controls: [
      { key: 'reflect', label: 'Fuerza', min: 0, max: 1, step: 0.01, hint: 'Se enciende solo con un caso en el centro: en el showcase.' },
      { key: 'reflectWidth', label: 'Grosor (px)', min: 0, max: 300, step: 1 },
      { key: 'reflectMaxFraction', label: 'Grosor máximo (fracción de la ventana)', min: 0, max: 0.3, step: 0.005 },
      { key: 'reflectSpan', label: 'Medio largo del óvalo (fracción de la ventana)', min: 0, max: 0.5, step: 0.01 },
      { key: 'reflectReach', label: 'Alcance de lo reflejado (px)', min: 0, max: 1000, step: 5 },
      { key: 'reflectBlur', label: 'Blur (px)', min: 0, max: 150, step: 1 },
      { key: 'reflectWiden', label: 'Estirado a lo largo del borde', min: 0.5, max: 3, step: 0.01 },
      { key: 'reflectSaturation', label: 'Saturación extra', min: 0, max: 3, step: 0.05 },
      { key: 'reflectHold', label: 'Entero hasta (fracción de la card)', min: 0, max: 0.5, step: 0.01 },
      { key: 'reflectFade', label: 'Se apaga a lo largo de (fracción de la card)', min: 0.01, max: 1, step: 0.01 },
    ],
  },
]

/** El tamaño de las cards del showcase (`CASE_LOOK` en `layout.ts`). */
export const CASE_CONTROLS: readonly ControlGroup<keyof CaseLook>[] = [
  {
    title: 'Cards del showcase',
    controls: [
      { key: 'start', label: 'Al entrar, arrancan a (fracción de la ventana)', min: 0.2, max: 0.9, step: 0.01, hint: 'Arriba va el título; el scroll lo saca y las cards llenan la ventana.' },
      { key: 'aspect', label: 'Proporción ancho / alto', min: 0.5, max: 2.5, step: 0.01, hint: '1.6 = 16:10; 1 = cuadrada; 0.8 = 4:5.' },
      { key: 'maxWidth', label: 'Ancho máximo (px)', min: 200, max: 2400, step: 10 },
      { key: 'maxFraction', label: 'Ancho máximo (fracción de la ventana)', min: 0.2, max: 1, step: 0.01, hint: 'La card centrada nunca entra en las franjas.' },
      { key: 'gap', label: 'Separación (px)', min: 0, max: 200, step: 1 },
      { key: 'compactAspect', label: 'Teléfono: proporción ancho / alto', min: 0.5, max: 2.5, step: 0.01 },
      { key: 'compactFraction', label: 'Teléfono: ancho máximo (fracción)', min: 0.2, max: 1, step: 0.01 },
      { key: 'compactGap', label: 'Teléfono: separación (px)', min: 0, max: 100, step: 1 },
    ],
  },
]

/** Decimales de un paso: 0.005 → 3. */
export function decimals(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

/** Un valor redondeado al paso de su control en `groups`. */
export function rounded(groups: readonly ControlGroup[], key: string, value: number): number {
  const control = groups.flatMap((g) => g.controls).find((c) => c.key === key)
  return control ? Number(value.toFixed(decimals(control.step))) : value
}

/** Los valores guardados sobre los de fábrica: solo números de claves conocidas. */
export function mergeValues<T extends object>(defaults: T, saved: unknown): T {
  const values = { ...defaults }
  if (!saved || typeof saved !== 'object') return values
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = (saved as Record<string, unknown>)[key as string]
    if (typeof value === 'number' && Number.isFinite(value)) (values as Record<keyof T, unknown>)[key] = value
  }
  return values
}

/** Solo los valores que difieren de los de fábrica: lo que se guarda, así un cambio de fábrica llega. */
export function diffValues<T extends object>(defaults: T, values: T): Partial<T> {
  const diff: Partial<T> = {}
  for (const key of Object.keys(defaults) as (keyof T)[]) if (values[key] !== defaults[key]) diff[key] = values[key]
  return diff
}

/** Los valores como código para pegar: `export const NAME: Type = { … }`. */
export function formatConst(name: string, type: string, values: object, groups: readonly ControlGroup[]): string {
  const lines = Object.entries(values).map(([key, value]) => `  ${key}: ${rounded(groups, key, value as number)},`)
  return `export const ${name}: ${type} = {\n${lines.join('\n')}\n}\n`
}

/** Las claves cuyo valor difiere del de fábrica. */
export function changedKeys<T extends object>(defaults: T, values: T, groups: readonly ControlGroup[]): (keyof T)[] {
  return (Object.keys(defaults) as (keyof T)[]).filter(
    (key) => rounded(groups, key as string, values[key] as number) !== rounded(groups, key as string, defaults[key] as number),
  )
}

/** El nombre de la constante de cada look en `edge-warp.ts`. */
export const WARP_CONST: Record<LookName, string> = { home: 'HOME_WARP', showcase: 'SHOWCASE_WARP' }

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
