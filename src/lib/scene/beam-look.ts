/**
 * Los haces de luz iridiscentes (`prism-beams.glsl`), sueltos del botón del
 * hero para que cualquier componente los reutilice: el botón (`prism-look.ts`,
 * en el aro y la píldora) los extiende con lo suyo, y `light-beams.svelte` los
 * dibuja en un rectángulo (`FieldLook`). Cada uso tiene sus propios valores,
 * porque cruzan cosas de tamaños muy distintos, pero el haz es el mismo.
 */

/** Cuántos haces puede haber como mucho (el shader reserva lugar para todos). */
export const MAX_BEAMS = 4

export interface BeamLook {
  // ── Haces ──
  /** Cuántos haces (1 a `MAX_BEAMS`). */
  beams: number
  /** Inclinación base, en grados. */
  angle: number
  /** Cuánto se separa cada haz de la base, al azar, en grados. */
  angleSpread: number
  /** Vaivén del ángulo, en grados. */
  wobble: number
  /** Ancho del haz, en px. */
  width: number
  speed: number
  /** Recorrido (1: llega a los bordes de lo que cruzan). */
  range: number
  /** 0: borde del haz duro, 1: suave. */
  soft: number

  // ── Color de cada haz: centro y amplitud del rango, en grados ──
  hue1: number
  hueRange1: number
  hue2: number
  hueRange2: number
  hue3: number
  hueRange3: number
  hue4: number
  hueRange4: number

  // ── Espectro ──
  /** Cuánto espectro entra a lo ancho del haz. */
  spectrum: number
  /** Cuánto cambian los colores al azar. */
  specVar: number
  /** Qué tan rápido cambian. */
  specRate: number
  /** Corrimiento entre canales, en px. */
  spread: number
  /** Núcleo blanco. */
  core: number
  /** Ancho del núcleo, en anchos de haz. */
  coreWidth: number
  /** Bandas finas. */
  stripes: number
  /** Separación de las bandas, en px. */
  stripeGap: number
  /** Manchas de color que fluyen por el haz (0: sin manchas). */
  flowAmount: number
  /** Tamaño de las manchas, en px. */
  flowScale: number
  flowSpeed: number
  /** Cuánto se deforman las manchas. */
  flowWarp: number
  /** Cuánto se corren a lo largo. */
  flowDrift: number

  // ── Brillo ──
  floor: number
  peak: number
  /** Velocidad del titileo. */
  flicker: number
  /** Tamaño de los tramos que titilan, en px. */
  patch: number
}

/**
 * Las claves de los haces que van al shader, con el nombre de su uniform (en
 * mayúsculas, como eran las constantes). Los colores de cada haz van aparte,
 * en `HUES` (`hueRanges`).
 */
export const BEAM_UNIFORMS = {
  beams: 'BEAMS',
  angle: 'ANGLE',
  angleSpread: 'ANGLE_SPREAD',
  wobble: 'WOBBLE',
  width: 'WIDTH',
  speed: 'SPEED',
  range: 'RANGE',
  soft: 'SOFT',
  spectrum: 'SPECTRUM',
  specVar: 'SPEC_VAR',
  specRate: 'SPEC_RATE',
  spread: 'SPREAD',
  core: 'CORE',
  coreWidth: 'CORE_WIDTH',
  stripes: 'STRIPES',
  stripeGap: 'STRIPE_GAP',
  flowAmount: 'FLOW_AMT',
  flowScale: 'FLOW_SCALE',
  flowSpeed: 'FLOW_SPEED',
  flowWarp: 'FLOW_WARP',
  flowDrift: 'FLOW_DRIFT',
  floor: 'FLOOR',
  peak: 'PEAK',
  flicker: 'FLICKER',
  patch: 'PATCH',
} as const satisfies Partial<Record<keyof BeamLook, string>>

/** Centro y amplitud del rango de color de cada haz, en grados. */
export function hueRanges(look: BeamLook): [number, number][] {
  return [
    [look.hue1, look.hueRange1],
    [look.hue2, look.hueRange2],
    [look.hue3, look.hueRange3],
    [look.hue4, look.hueRange4],
  ]
}

/** La cantidad de haces que dibuja el shader: entera, de 1 a `MAX_BEAMS`. */
export function beamCount(look: BeamLook): number {
  return Math.round(Math.min(MAX_BEAMS, Math.max(1, look.beams)))
}

/** Los valores de los haces de un look (sin lo demás). */
export function beamsOf(look: BeamLook): BeamLook {
  const out = {} as BeamLook
  for (const key of BEAM_KEYS) out[key] = look[key]
  return out
}

/** Todas las claves de `BeamLook`, en orden: las del shader y los colores. */
export const BEAM_KEYS: readonly (keyof BeamLook)[] = [
  'beams',
  'angle',
  'angleSpread',
  'wobble',
  'width',
  'speed',
  'range',
  'soft',
  'hue1',
  'hueRange1',
  'hue2',
  'hueRange2',
  'hue3',
  'hueRange3',
  'hue4',
  'hueRange4',
  'spectrum',
  'specVar',
  'specRate',
  'spread',
  'core',
  'coreWidth',
  'stripes',
  'stripeGap',
  'flowAmount',
  'flowScale',
  'flowSpeed',
  'flowWarp',
  'flowDrift',
  'floor',
  'peak',
  'flicker',
  'patch',
]

/** Cómo se ven los haces en un rectángulo (`light-beams.svelte`): los haces y su campo de luz. */
export interface FieldLook extends BeamLook {
  /** Escala del dibujo de los haces: 1, a la medida del botón; más, todo más grande. */
  scale: number
  /** Luz de los haces en el rectángulo. */
  light: number
  /** Luz extra en el bisel (o, con `side="top"`, pegada al borde de arriba). */
  edge: number
  /** Ancho del bisel, en px. */
  bevel: number
  /** Cuánto se desvían los haces hacia el canto, en px. */
  bend: number
  /** Aberración del desvío (cada canal distinto). */
  aberration: number
  /** Opacidad de toda la luz. */
  opacity: number
  /** Con `side="top"`, cuánto se apaga la franja hacia abajo (0: pareja; 1: se apaga del todo). */
  fade: number
}

/** Las claves del campo de luz que van al shader (`light-beams.frag.glsl`), con su uniform. */
export const FIELD_UNIFORMS = {
  light: 'FIELD_LIGHT',
  edge: 'FIELD_EDGE',
  bevel: 'FIELD_BEVEL',
  bend: 'FIELD_BEND',
  aberration: 'FIELD_AB',
  opacity: 'FIELD_OPACITY',
  scale: 'FIELD_SCALE',
  fade: 'FIELD_FADE',
} as const satisfies Record<Exclude<keyof FieldLook, keyof BeamLook>, string>
