// Banco de pruebas de los vidrios de la navbar (temporal). Con `?tune` en la
// URL aparece un panel (`lens-tuner.svelte`) que edita estos valores en vivo:
// el lente oscuro (propuesta `tinta`) y el vidrio de la barra y la burbuja.
// Sin `?tune` se usan los valores de base.
import { NAV_GLASS } from './nav-parts.js'

type Profile = 'circle' | 'squircle' | 'dome'
type TintMode = 'overlay' | 'dye'

export interface LensTune {
  /** Distancia del lente a los bordes de la pastilla, en px. */
  inset: number
  /** Cuánto se deforma al viajar: 0 rígido, 1 la gota elástica entera. */
  stretch: number
  profile: Profile
  bevelWidth: number
  bevelDepth: number
  lip: number
  lipSharpness: number
  thickness: number
  ior: number
  refraction: number
  dispersion: number
  magnify: number
  blur: number
  tint: string
  tintOpacity: number
  tintMode: TintMode
  brightness: number
  saturation: number
  reflection: number
  specular: number
  rim: number
  shadowOpacity: number
  tilt: number
  /** Color del ícono y el texto del activo, encima del lente. */
  label: 'paper' | 'ink'
}

export interface BarTune {
  profile: Profile
  bevelWidth: number
  bevelDepth: number
  lip: number
  lipSharpness: number
  thickness: number
  ior: number
  refraction: number
  dispersion: number
  magnify: number
  blur: number
  edgeSharpness: number
  tint: string
  tintOpacity: number
  tintMode: TintMode
  brightness: number
  saturation: number
  reflection: number
  specular: number
  rim: number
  softness: number
  shadowOpacity: number
  shadowSpread: number
  shadowOffsetY: number
  tilt: number
  surfaceRoughness: number
}

/** El lente oscuro, con los valores que eligió el usuario en el banco. */
export const LENS_TUNE_DEFAULTS: LensTune = {
  inset: 3,
  stretch: 0.6,
  profile: 'squircle',
  bevelWidth: 16,
  bevelDepth: 20,
  lip: 16,
  lipSharpness: 5,
  thickness: 30,
  ior: 1.37,
  refraction: 2.1,
  dispersion: 0.185,
  magnify: 0.96,
  blur: 0,
  tint: '#111111',
  tintOpacity: 0.5,
  tintMode: 'overlay',
  brightness: -0.02,
  saturation: 1,
  reflection: 0.2,
  specular: 0.07,
  rim: 0.15,
  shadowOpacity: 0.02,
  tilt: 0.5,
  label: 'paper',
}

/** La barra y la burbuja del logo: `NAV_GLASS`. */
export const BAR_TUNE_DEFAULTS: BarTune = { ...NAV_GLASS }

/** `?tune` prende el panel; queda prendido en la pestaña aunque la URL pierda el query. */
export function tuning(): boolean {
  try {
    if (new URLSearchParams(location.search).has('tune')) sessionStorage.setItem('tune', '1')
    return sessionStorage.getItem('tune') === '1'
  } catch {
    return false
  }
}

const tune = tuning()

/** Lo guardado en el navegador, solo con el banco prendido. */
function load<T extends object>(store: string, defaults: T): T {
  if (!tune) return { ...defaults }
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(store) ?? 'null') as Partial<T> | null) }
  } catch {
    return { ...defaults }
  }
}

/** Los valores en uso. */
export const lensTune: LensTune = $state(load('lens-tune', LENS_TUNE_DEFAULTS))
export const barTune: BarTune = $state(load('bar-tune', BAR_TUNE_DEFAULTS))

export function saveTune(): void {
  try {
    localStorage.setItem('lens-tune', JSON.stringify(lensTune))
    localStorage.setItem('bar-tune', JSON.stringify(barTune))
  } catch {
    // Sin almacenamiento: los cambios duran hasta recargar.
  }
}

export function resetLensTune(): void {
  Object.assign(lensTune, LENS_TUNE_DEFAULTS)
  saveTune()
}

export function resetBarTune(): void {
  Object.assign(barTune, BAR_TUNE_DEFAULTS)
  saveTune()
}
