/**
 * Cómo se ven los bordes de la ventana (ver `edge-warp.svelte` y
 * `edge-warp.frag.glsl`): el contenido que entra en las franjas de arriba y
 * de abajo se deforma y, en el showcase, los bordes izquierdo y derecho
 * reflejan lo que hay hacia el centro.
 */
export interface WarpLook {
  /** Alto de cada franja (px CSS), y como mucho esta fracción de la ventana. */
  height: number
  maxFraction: number
  /** Alto de cada franja en una columna (teléfono), donde la ventana es angosta y el contenido, alto. */
  compactHeight: number
  /** Ángulo (rad) del cilindro en el borde: más, más se comprime hacia él. Hasta 1.5. Sin efecto con `stretch`. */
  curve: number
  /**
   * En vez del cilindro, el contenido se estira hacia el borde, como si se lo
   * tragara: 0 = sin estirar; 0.9 = en el borde, cada px de contenido ocupa 10.
   * Hasta 0.95.
   */
  stretch: number
  /** Cuánto se abre hacia los costados en el borde: 0.45 = ×1.45. */
  spread: number
  /** Diferencia de deformación entre canales: el rojo se abre menos y el azul más. */
  aberration: number
  /** Separación vertical de canales en el borde (px CSS). */
  split: number
  /** Radio del blur en el borde (px CSS). */
  blur: number
  /** Ondulación líquida pegada al borde: amplitud y largo de onda (px CSS). */
  ripple: number
  wavelength: number
  /**
   * Reflejo en los bordes izquierdo y derecho: cada borde, como un espejo
   * curvo, refleja lo que hay hacia el centro de la ventana (los casos),
   * difuminado y abierto, con el color del contenido. 0 = sin reflejo.
   */
  reflect: number
  /** Ancho de la franja del reflejo (px CSS), y como mucho esta fracción del ancho de la ventana. */
  reflectWidth: number
  reflectMaxFraction: number
  /** Hasta dónde llega lo que refleja, medido desde el borde de la franja (px CSS; como mucho, hasta el centro). */
  reflectReach: number
  /** Radio del blur del reflejo (px CSS). */
  reflectBlur: number
  /**
   * Medio alto del óvalo del reflejo, como fracción del alto de la ventana: el
   * reflejo va solo en el centro de cada costado, no en todo el borde.
   */
  reflectSpan: number
  /**
   * Cuándo se enciende el reflejo, como fracción del alto de la card: entero
   * mientras el centro de la card está a menos de `reflectHold` del centro de
   * la ventana, y se apaga a lo largo de `reflectFade` más.
   */
  reflectHold: number
  reflectFade: number
  /** Cuánto más alto se ve el reflejo que lo reflejado: 1.4 = ×1.4. */
  reflectWiden: number
  /** Saturación extra del reflejo: 0 = el color tal cual; 1 = el doble de croma. */
  reflectSaturation: number
}

/** La home: una franja angosta, el contenido se dobla como sobre un cilindro. Sin reflejo. */
export const HOME_WARP: WarpLook = {
  height: 45,
  maxFraction: 0.13,
  compactHeight: 45,
  curve: 1.3,
  stretch: 0,
  spread: 0.45,
  aberration: 0.3,
  split: 6,
  blur: 24,
  ripple: 5,
  wavelength: 140,
  reflect: 0,
  reflectWidth: 0,
  reflectMaxFraction: 0,
  reflectReach: 0,
  reflectBlur: 0,
  reflectSpan: 0,
  reflectHold: 0,
  reflectFade: 1,
  reflectWiden: 1,
  reflectSaturation: 0,
}

/**
 * El showcase (pedido del usuario, 2026-11-25): el mismo efecto con
 * protagonismo. Franjas en las que los casos se estiran hacia el borde y se
 * abren a los costados, y en los bordes izquierdo y derecho, el reflejo de
 * los casos. Valores ajustados por el usuario en el banco de pruebas
 * (`src/lib/lab/`), 2026-11-25.
 */
export const SHOWCASE_WARP: WarpLook = {
  height: 80,
  maxFraction: 0.2,
  compactHeight: 60,
  curve: 0,
  stretch: 0.82,
  spread: 1.1,
  aberration: 0.12,
  split: 8,
  blur: 30,
  ripple: 7,
  wavelength: 180,
  reflect: 0.85,
  reflectWidth: 41,
  reflectMaxFraction: 0.015,
  reflectReach: 355,
  reflectBlur: 130,
  reflectSpan: 0.42,
  reflectHold: 0.06,
  reflectFade: 0.5,
  reflectWiden: 0.75,
  reflectSaturation: 1.7,
}

/** Alto de cada franja de la deformación en una ventana de `vh` (px CSS); `compact`, en una columna. */
export function bandHeight(look: WarpLook, vh: number, compact = false): number {
  return Math.max(0, Math.min(compact ? look.compactHeight : look.height, vh * look.maxFraction))
}

/** Ancho de la franja del reflejo (izquierda y derecha) en una ventana de `vw` de ancho (px CSS). */
export function reflectWidth(look: WarpLook, vw: number): number {
  return look.reflect > 0 ? Math.max(0, Math.min(look.reflectWidth, vw * look.reflectMaxFraction)) : 0
}

/** Medio alto del óvalo del reflejo (px CSS) en una ventana de `vh` de alto. */
export function reflectSpan(look: WarpLook, vh: number): number {
  return look.reflect > 0 ? Math.max(0, vh * look.reflectSpan) : 0
}

/**
 * Cuánto se enciende el reflejo (0 a 1) según la card más centrada: entero
 * mientras su centro está cerca del centro de la ventana (`reflectHold`), y se
 * apaga a lo largo de `reflectFade` (con los valores del showcase, cuando el
 * espacio entre cards llega al centro). `offsets`: distancia de cada centro
 * de card al centro de la ventana (px CSS, cualquier signo).
 */
export function reflectFocus(offsets: readonly number[], cardHeight: number, look: WarpLook): number {
  if (offsets.length === 0 || cardHeight <= 0) return 0
  const nearest = Math.min(...offsets.map(Math.abs))
  const fade = Math.max(1e-3, cardHeight * look.reflectFade)
  const t = Math.min(1, Math.max(0, (nearest - cardHeight * look.reflectHold) / fade))
  return 1 - t * t * (3 - 2 * t)
}
