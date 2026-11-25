/**
 * Cómo se ven los bordes de la ventana (ver `edge-warp.svelte` y
 * `edge-warp.frag.glsl`): el contenido que entra en las franjas de los bordes
 * por donde pasa el scroll se deforma y, en el showcase, los otros dos bordes
 * reflejan lo que hay hacia el centro.
 */

/**
 * Por dónde entra el contenido: `vertical`, por arriba y por abajo (la home);
 * `horizontal`, por los costados (el showcase, con los casos en fila). Las
 * franjas van en esos bordes y el reflejo en los otros dos.
 */
export type WarpAxis = 'vertical' | 'horizontal'

export interface WarpLook {
  /** Tamaño de cada franja, hacia adentro desde su borde (px CSS), y como mucho esta fracción de la ventana en el eje del scroll. */
  height: number
  maxFraction: number
  /** Tamaño de cada franja en un teléfono. */
  compactHeight: number
  /**
   * Tamaño mínimo de cada franja (px CSS): en el showcase, las franjas se
   * achican hasta acá para dejarle lugar a la card centrada (`showcaseBand`).
   */
  minHeight: number
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
   * Reflejo en los otros dos bordes (los que no son del scroll): cada borde,
   * como un espejo curvo, refleja lo que hay hacia el centro de la ventana
   * (los casos), difuminado y abierto, con el color del contenido. 0 = sin reflejo.
   */
  reflect: number
  /** Grosor de la franja del reflejo (px CSS), y como mucho esta fracción de la ventana en ese sentido. */
  reflectWidth: number
  reflectMaxFraction: number
  /** Hasta dónde llega lo que refleja, medido desde el borde de la franja (px CSS; como mucho, hasta el centro). */
  reflectReach: number
  /** Radio del blur del reflejo (px CSS). */
  reflectBlur: number
  /**
   * Medio largo del óvalo del reflejo, a lo largo de su borde, como fracción
   * de la ventana: el reflejo va solo en el centro del borde, no en todo.
   */
  reflectSpan: number
  /**
   * Cuándo se enciende el reflejo, como fracción de la card en el eje del scroll: entero
   * mientras el centro de la card está a menos de `reflectHold` del centro de
   * la ventana, y se apaga a lo largo de `reflectFade` más.
   */
  reflectHold: number
  reflectFade: number
  /** Cuánto más largo (a lo largo de su borde) se ve el reflejo que lo reflejado: 1.4 = ×1.4. */
  reflectWiden: number
  /** Saturación extra del reflejo: 0 = el color tal cual; 1 = el doble de croma. */
  reflectSaturation: number
}

/** La home: una franja angosta, el contenido se dobla como sobre un cilindro. Sin reflejo. */
export const HOME_WARP: WarpLook = {
  height: 45,
  maxFraction: 0.13,
  compactHeight: 45,
  minHeight: 45,
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
 * El showcase (pedido del usuario, 2026-11-25), con el eje horizontal: el
 * mismo efecto con protagonismo. Franjas a los costados en las que los casos
 * se estiran hacia el borde y se abren, y arriba y abajo, el reflejo de los
 * casos. Valores ajustados por el usuario en el banco de pruebas
 * (`src/lib/lab/`), 2026-11-25 (la segunda vez, ya con la fila horizontal).
 */
export const SHOWCASE_WARP: WarpLook = {
  height: 150,
  maxFraction: 0.22,
  compactHeight: 60,
  minHeight: 60,
  curve: 0.34,
  stretch: 0.9,
  spread: 1.8,
  aberration: 0.5,
  split: 18,
  blur: 45,
  ripple: 8,
  wavelength: 180,
  reflect: 1,
  reflectWidth: 86,
  reflectMaxFraction: 0.25,
  reflectReach: 80,
  reflectBlur: 140,
  reflectSpan: 0.26,
  reflectHold: 0.2,
  reflectFade: 0.3,
  reflectWiden: 2.71,
  reflectSaturation: 1.7,
}

/** Tamaño de cada franja de la deformación, con `along` px de ventana en el eje del scroll; `compact`, en un teléfono. */
export function bandHeight(look: WarpLook, along: number, compact = false): number {
  return Math.max(0, Math.min(compact ? look.compactHeight : look.height, along * look.maxFraction))
}

/** Grosor de la franja del reflejo, con `across` px de ventana en el sentido del grosor (a través del scroll). */
export function reflectWidth(look: WarpLook, across: number): number {
  return look.reflect > 0 ? Math.max(0, Math.min(look.reflectWidth, across * look.reflectMaxFraction)) : 0
}

/** Medio largo del óvalo del reflejo (px CSS), con `along` px de ventana a lo largo de su borde. */
export function reflectSpan(look: WarpLook, along: number): number {
  return look.reflect > 0 ? Math.max(0, along * look.reflectSpan) : 0
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
