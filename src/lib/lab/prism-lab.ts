import { MAX_BEAMS, type PrismLook } from '$lib/scene/prism-look.js'

/**
 * Banco de pruebas del botón del hero (solo en desarrollo): qué se puede
 * ajustar, en qué rango, y cómo se copian los valores a `prism-look.ts`.
 */

export interface Control {
  key: keyof PrismLook
  label: string
  min: number
  max: number
  step: number
  /** Una aclaración corta, si hace falta. */
  hint?: string
  /** El control es un color (tono en grados): se muestra la muestra. */
  hue?: boolean
}

export interface ControlGroup {
  title: string
  controls: readonly Control[]
}

export const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    title: 'Haces',
    controls: [
      { key: 'beams', label: 'Cantidad', min: 1, max: MAX_BEAMS, step: 1 },
      { key: 'angle', label: 'Inclinación base (°)', min: -90, max: 90, step: 1 },
      { key: 'angleSpread', label: 'Separación entre haces (°)', min: 0, max: 90, step: 1 },
      { key: 'wobble', label: 'Vaivén del ángulo (°)', min: 0, max: 45, step: 0.5 },
      { key: 'width', label: 'Ancho (px)', min: 1, max: 40, step: 0.5 },
      { key: 'speed', label: 'Velocidad', min: 0, max: 1, step: 0.01 },
      { key: 'range', label: 'Recorrido', min: 0, max: 3, step: 0.05, hint: '1: llega a los bordes de la lente.' },
      { key: 'soft', label: 'Borde suave', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'Color de cada haz',
    controls: [
      { key: 'hue1', label: 'Haz 1: tono (°)', min: 0, max: 360, step: 1, hue: true },
      { key: 'hueRange1', label: 'Haz 1: amplitud (°)', min: 0, max: 360, step: 1 },
      { key: 'hue2', label: 'Haz 2: tono (°)', min: 0, max: 360, step: 1, hue: true },
      { key: 'hueRange2', label: 'Haz 2: amplitud (°)', min: 0, max: 360, step: 1 },
      { key: 'hue3', label: 'Haz 3: tono (°)', min: 0, max: 360, step: 1, hue: true, hint: 'Con 3 haces o más.' },
      { key: 'hueRange3', label: 'Haz 3: amplitud (°)', min: 0, max: 360, step: 1 },
      { key: 'hue4', label: 'Haz 4: tono (°)', min: 0, max: 360, step: 1, hue: true, hint: 'Con 4 haces.' },
      { key: 'hueRange4', label: 'Haz 4: amplitud (°)', min: 0, max: 360, step: 1 },
    ],
  },
  {
    title: 'Espectro',
    controls: [
      { key: 'spectrum', label: 'Espectro a lo ancho', min: 0, max: 8, step: 0.05 },
      { key: 'specVar', label: 'Cambio de colores al azar', min: 0, max: 2, step: 0.01 },
      { key: 'specRate', label: 'Velocidad del cambio', min: 0, max: 3, step: 0.01 },
      { key: 'spread', label: 'Dispersión entre canales (px)', min: 0, max: 5, step: 0.05 },
      { key: 'core', label: 'Núcleo blanco', min: 0, max: 2, step: 0.01 },
      { key: 'coreWidth', label: 'Ancho del núcleo', min: 0.01, max: 1, step: 0.01 },
      { key: 'stripes', label: 'Bandas finas', min: 0, max: 1, step: 0.01 },
      { key: 'stripeGap', label: 'Separación de las bandas (px)', min: 0.3, max: 6, step: 0.05 },
    ],
  },
  {
    title: 'Manchas de color',
    controls: [
      { key: 'flowAmount', label: 'Cantidad', min: 0, max: 1, step: 0.01, hint: 'Con 0, apagadas (no se calculan).' },
      { key: 'flowScale', label: 'Tamaño (px)', min: 2, max: 100, step: 1 },
      { key: 'flowSpeed', label: 'Velocidad', min: 0, max: 3, step: 0.01 },
      { key: 'flowWarp', label: 'Deformación', min: 0, max: 3, step: 0.01 },
      { key: 'flowDrift', label: 'Corrimiento', min: 0, max: 3, step: 0.01 },
    ],
  },
  {
    title: 'Brillo',
    controls: [
      { key: 'floor', label: 'Mínimo', min: 0, max: 2, step: 0.01 },
      { key: 'peak', label: 'Máximo', min: 0, max: 4, step: 0.01 },
      { key: 'flicker', label: 'Velocidad del titileo', min: 0, max: 6, step: 0.05 },
      { key: 'patch', label: 'Tramos que titilan (px)', min: 2, max: 80, step: 1 },
      { key: 'hover', label: 'Extra con el puntero encima', min: 0, max: 3, step: 0.05 },
      { key: 'hoverSpeed', label: 'Velocidad del hover (por s)', min: 1, max: 40, step: 0.5 },
    ],
  },
  {
    title: 'Aro',
    controls: [
      { key: 'ring', label: 'Grosor (px)', min: 1, max: 15, step: 0.25 },
      { key: 'gain', label: 'Fuerza de los haces en el aro', min: 0, max: 6, step: 0.05 },
      { key: 'lens', label: 'Aumento', min: 0, max: 0.95, step: 0.01 },
      { key: 'lensShift', label: 'Desvío hacia adentro (px)', min: 0, max: 15, step: 0.1 },
      { key: 'lensAb', label: 'Aberración', min: 0, max: 0.5, step: 0.005 },
      { key: 'lensEdge', label: 'Reflejos del vidrio', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'Lente y flecha',
    controls: [
      { key: 'lensRadius', label: 'Radio de la lente (px)', min: 10, max: 26, step: 0.5, hint: 'La píldora mide 52 px de alto.' },
      { key: 'lensDark', label: 'Oscuridad de la lente', min: 0, max: 1, step: 0.01, hint: '1: el vidrio de la píldora; menos, más oscura.' },
      { key: 'lensOpacity', label: 'Opacidad de la lente', min: 0, max: 1, step: 0.01, hint: '1: opaca; menos, se ven el vidrio y los haces de atrás.' },
      { key: 'stroke', label: 'Trazo de la flecha (px)', min: 0.5, max: 4, step: 0.1 },
    ],
  },
  {
    title: 'Click',
    controls: [
      { key: 'flash', label: 'Destello de los haces', min: 0, max: 8, step: 0.05 },
      { key: 'flashDecay', label: 'Se apaga (por s)', min: 0.5, max: 20, step: 0.1 },
      { key: 'waveSpeed', label: 'Velocidad de la onda (px/s)', min: 20, max: 800, step: 5 },
      { key: 'waveWidth', label: 'Grosor de la onda (px)', min: 1, max: 60, step: 0.5 },
      { key: 'waveGrow', label: 'Engorda (px/s)', min: 0, max: 150, step: 1 },
      { key: 'waveFade', label: 'Se desvanece (por s)', min: 0, max: 10, step: 0.05 },
      { key: 'waveGain', label: 'Opacidad de la onda', min: 0, max: 4, step: 0.05 },
      { key: 'waveLife', label: 'Duración (s)', min: 0.1, max: 4, step: 0.05 },
      { key: 'clickDelay', label: 'Espera antes de navegar (ms)', min: 0, max: 2000, step: 10 },
    ],
  },
  {
    title: 'Píldora',
    controls: [
      { key: 'fontSize', label: 'Tamaño del label (px)', min: 12, max: 22, step: 0.5 },
      { key: 'labelX', label: 'Inicio del label (px)', min: 40, max: 90, step: 1 },
      { key: 'paddingRight', label: 'Margen derecho (px)', min: 8, max: 60, step: 1 },
      { key: 'labelInk', label: 'Label en tinta', min: 0, max: 1, step: 1, hint: '0: blanco; 1: tinta, para un vidrio claro.' },
    ],
  },
  {
    title: 'Vidrio de la píldora',
    controls: [
      { key: 'tintOpacity', label: 'Tinte oscuro', min: 0, max: 1, step: 0.01, hint: 'Con poco tinte, la píldora es un vidrio y se ve lo de atrás.' },
      { key: 'glassRefraction', label: 'Refracción', min: 0, max: 3, step: 0.01 },
      { key: 'glassDispersion', label: 'Dispersión', min: 0, max: 0.5, step: 0.005 },
      { key: 'glassBevel', label: 'Profundidad del bisel', min: 0, max: 40, step: 0.5 },
      { key: 'glassMagnify', label: 'Aumento', min: 0.8, max: 1.3, step: 0.01 },
      { key: 'glassBlur', label: 'Esmerilado (px)', min: 0, max: 30, step: 0.5, hint: 'Desenfoca lo que se ve detrás: los haces en la píldora y el fondo.' },
      { key: 'glassBrightness', label: 'Brillo', min: -0.3, max: 0.3, step: 0.01 },
      { key: 'glassSpecular', label: 'Especular', min: 0, max: 1, step: 0.01 },
      { key: 'glassReflection', label: 'Reflejo', min: 0, max: 1, step: 0.01 },
      { key: 'rim', label: 'Brillo del canto', min: 0, max: 1, step: 0.01 },
      { key: 'glassShadow', label: 'Sombra', min: 0, max: 0.1, step: 0.005 },
    ],
  },
  {
    title: 'Haces en la píldora',
    controls: [
      // Van debajo del vidrio: el vidrio de arriba los refracta, los esmerila y los tiñe.
      { key: 'pillBeams', label: 'Luz en el cuerpo', min: 0, max: 2, step: 0.01, hint: 'Con 0 (y el bisel en 0), la luz no sale de la lente.' },
      { key: 'pillEdge', label: 'Luz en el bisel', min: 0, max: 4, step: 0.05 },
      { key: 'pillBevel', label: 'Ancho del bisel (px)', min: 1, max: 26, step: 0.5 },
      { key: 'pillBend', label: 'Desvío en el canto (px)', min: 0, max: 20, step: 0.1, hint: 'Se suma a la refracción del vidrio.' },
      { key: 'pillRoam', label: 'Recorrido por la píldora', min: 0, max: 1, step: 0.01, hint: '0: los mismos haces del aro, que salen de la lente; 1: deambulan por toda la píldora.' },
    ],
  },
]

/** Un punto de partida para probar la píldora de vidrio con los haces adentro. */
export const GLASS_PILL_TRY: Partial<PrismLook> = {
  tintOpacity: 0.12,
  labelInk: 1,
  glassRefraction: 1.4,
  glassDispersion: 0.12,
  glassBrightness: 0.08,
  rim: 0.3,
  glassShadow: 0.06,
  pillBeams: 0.35,
  pillEdge: 1.8,
  pillBevel: 12,
  pillBend: 6,
  pillRoam: 1,
}

/** Decimales de un paso: 0.005 → 3. */
export function decimals(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

const CONTROLS = CONTROL_GROUPS.flatMap((group) => group.controls)

/** Un valor redondeado al paso de su control. */
export function rounded(key: keyof PrismLook, value: number): number {
  const control = CONTROLS.find((c) => c.key === key)
  return control ? Number(value.toFixed(decimals(control.step))) : value
}

/** Los valores guardados sobre los de fábrica: solo números de claves conocidas. */
export function mergeLook(defaults: PrismLook, saved: unknown): PrismLook {
  const look = { ...defaults }
  if (!saved || typeof saved !== 'object') return look
  for (const key of Object.keys(defaults) as (keyof PrismLook)[]) {
    const value = (saved as Record<string, unknown>)[key]
    if (typeof value === 'number' && Number.isFinite(value)) look[key] = value
  }
  return look
}

/** El look como código para pegar en `prism-look.ts`. */
export function formatLook(look: PrismLook): string {
  const lines = (Object.keys(look) as (keyof PrismLook)[]).map((key) => `  ${key}: ${rounded(key, look[key])},`)
  return `export const PRISM_LOOK: PrismLook = {\n${lines.join('\n')}\n}\n`
}

/** Las claves cuyo valor difiere del de fábrica. */
export function changedKeys(defaults: PrismLook, look: PrismLook): (keyof PrismLook)[] {
  return (Object.keys(defaults) as (keyof PrismLook)[]).filter((key) => rounded(key, look[key]) !== rounded(key, defaults[key]))
}
