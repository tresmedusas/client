/**
 * El look del botón del hero (`prism-cta.svelte`, `prism-ring.frag.glsl` y
 * `prism-beams.glsl`): los haces, el aro, el destello del click y la píldora.
 * Los valores salen del banco de pruebas (`src/lib/lab/prism-lab*`): en
 * desarrollo se ajustan en vivo y «Copiar valores» da este objeto para pegar.
 */

/** Cuántos haces puede haber como mucho (el shader reserva lugar para todos). */
export const MAX_BEAMS = 4

export interface PrismLook {
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
  /** Cuánto más brillan los haces con el puntero encima (0.3 = 30 %). */
  hover: number
  /** Qué tan rápido entra y sale el brillo del hover (por segundo). */
  hoverSpeed: number

  // ── Aro (el vidrio por el que se ven los haces) ──
  /** Grosor del aro, en px. */
  ring: number
  /** Aumento. */
  lens: number
  /** Desvío hacia adentro en el medio del canto, en px. */
  lensShift: number
  /** Aberración (cada canal se desvía distinto). */
  lensAb: number
  /** Reflejos del vidrio del aro. */
  lensEdge: number
  /** Los haces se ven más fuertes en el aro, que es fino. */
  gain: number

  // ── Lente y flecha ──
  /** Radio de la lente, en px. */
  lensRadius: number
  /** La lente es el vidrio de la píldora oscurecido (en sRGB). */
  lensDark: number
  /** Opacidad de la lente: 1, opaca; menos, deja ver el vidrio y los haces de atrás (la flecha y el aro siguen enteros). */
  lensOpacity: number
  /** Grosor del trazo de la flecha, en px. */
  stroke: number

  // ── Destello y onda del click ──
  /** Cuánto más brillan los haces del aro en el click. */
  flash: number
  /** Qué tan rápido se apagan (por segundo). */
  flashDecay: number
  /** Velocidad de la onda, en px por segundo. */
  waveSpeed: number
  /** Grosor de la onda al salir, en px. */
  waveWidth: number
  /** Cuánto engorda por segundo, en px. */
  waveGrow: number
  /** Qué tan rápido se desvanece (por segundo). */
  waveFade: number
  /** Opacidad de la onda donde el aro tiene luz. */
  waveGain: number
  /** Segundos hasta que deja de dibujarse. */
  waveLife: number
  /** Cuánto espera la página antes de navegar después del click, en ms. */
  clickDelay: number

  // ── Píldora ──
  /** Tamaño del label, en px. */
  fontSize: number
  /** Borde izquierdo del label, desde el borde de la píldora, en px. */
  labelX: number
  /** Margen a la derecha del label, en px. */
  paddingRight: number
  /** Opacidad del tinte `brandDeep` del vidrio. */
  tintOpacity: number
  /** Brillo del canto del vidrio. */
  rim: number
  /** Color del label: 0, blanco (sobre el vidrio oscuro); 1, tinta (sobre un vidrio claro). */
  labelInk: number

  // ── Vidrio de la píldora (`Glass`, sobre el preset `pill`) ──
  /** Cuánto desvía lo que se ve a través. */
  glassRefraction: number
  /** Separación de colores en el canto. */
  glassDispersion: number
  /** Profundidad del bisel. */
  glassBevel: number
  /** Aumento de lo que se ve a través (1: igual). */
  glassMagnify: number
  /** Esmerilado de lo que se ve detrás (el fondo y los haces en la píldora), en px. */
  glassBlur: number
  /** Aclara (+) u oscurece (−) lo que se ve a través. */
  glassBrightness: number
  glassSpecular: number
  glassReflection: number
  /** Sombra (como mucho 0.1, DESIGN.md §5). */
  glassShadow: number

  // ── Haces en la píldora: los del aro siguen de largo detrás del vidrio, que los refracta ──
  /** Luz de los haces en el cuerpo de la píldora (0: no salen de la lente). */
  pillBeams: number
  /** Luz extra en el bisel, donde el vidrio los junta. */
  pillEdge: number
  /** Ancho del bisel, en px. */
  pillBevel: number
  /** Cuánto se desvían hacia adentro en el canto, en px (con la aberración del aro). */
  pillBend: number
  /** Por dónde deambulan: 0, alrededor de la lente (los mismos del aro, que siguen de largo); 1, por toda la píldora. */
  pillRoam: number
}

export const PRISM_LOOK: PrismLook = {
  beams: 2,
  angle: -11,
  angleSpread: 47,
  wobble: 5,
  width: 15,
  speed: 0.15,
  range: 1.5,
  soft: 0.1,
  hue1: 46,
  hueRange1: 36,
  hue2: 287,
  hueRange2: 227,
  hue3: 180,
  hueRange3: 120,
  hue4: 0,
  hueRange4: 120,
  spectrum: 3.3,
  specVar: 1.05,
  specRate: 0.7,
  spread: 0.5,
  core: 0.5,
  coreWidth: 0.1,
  stripes: 0.24,
  stripeGap: 1,
  flowAmount: 0,
  flowScale: 30,
  flowSpeed: 0.5,
  flowWarp: 1,
  flowDrift: 0.5,
  floor: 0.65,
  peak: 1.5,
  flicker: 1.5,
  patch: 18,
  hover: 0.3,
  hoverSpeed: 10,
  ring: 6,
  lens: 0.6,
  lensShift: 5.5,
  lensAb: 0.05,
  lensEdge: 0.34,
  gain: 2.35,
  lensRadius: 22,
  lensDark: 0.8,
  lensOpacity: 0.38,
  stroke: 1.8,
  flash: 2.5,
  flashDecay: 5,
  waveSpeed: 260,
  waveWidth: 32,
  waveGrow: 30,
  waveFade: 1.2,
  waveGain: 1.6,
  waveLife: 1.15,
  clickDelay: 650,
  fontSize: 16,
  labelX: 62,
  paddingRight: 26,
  tintOpacity: 0.45,
  rim: 0.2,
  labelInk: 0,
  glassRefraction: 1.65,
  glassDispersion: 0.165,
  glassBevel: 10,
  glassMagnify: 1.04,
  glassBlur: 4,
  glassBrightness: 0,
  glassSpecular: 0.2,
  glassReflection: 0.6,
  glassShadow: 0,
  pillBeams: 1,
  pillEdge: 2.1,
  pillBevel: 22,
  pillBend: 11,
  pillRoam: 1,
}

/**
 * Las claves del look que van al shader, con el nombre de su uniform (en
 * mayúsculas, como eran las constantes). Los colores de cada haz van aparte,
 * en `HUES`.
 */
export const SHADER_UNIFORMS = {
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
  hover: 'HOVER',
  ring: 'RING',
  lens: 'LENS',
  lensShift: 'LENS_SHIFT',
  lensAb: 'LENS_AB',
  lensEdge: 'LENS_EDGE',
  gain: 'GAIN',
  lensDark: 'LENS_DARK',
  lensOpacity: 'LENS_OPACITY',
  stroke: 'STROKE',
  flash: 'FLASH',
  flashDecay: 'FLASH_DECAY',
  waveSpeed: 'WAVE_SPEED',
  waveWidth: 'WAVE_WIDTH',
  waveGrow: 'WAVE_GROW',
  waveFade: 'WAVE_FADE',
  waveGain: 'WAVE_GAIN',
  waveLife: 'WAVE_LIFE',
  pillBeams: 'PILL_BEAMS',
  pillEdge: 'PILL_EDGE',
  pillBevel: 'PILL_BEVEL',
  pillBend: 'PILL_BEND',
  pillRoam: 'PILL_ROAM',
} as const satisfies Partial<Record<keyof PrismLook, string>>

/** Centro y amplitud del rango de color de cada haz, en grados. */
export function hueRanges(look: PrismLook): [number, number][] {
  return [
    [look.hue1, look.hueRange1],
    [look.hue2, look.hueRange2],
    [look.hue3, look.hueRange3],
    [look.hue4, look.hueRange4],
  ]
}
