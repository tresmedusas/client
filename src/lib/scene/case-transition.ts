import type { WarpLook } from './edge-warp.js'

/**
 * La transición al abrir un caso desde su card del showcase (pedido del
 * usuario, 2026-11-26). De tres demos, el usuario eligió `swallow` y guardó
 * `open` para más adelante (la zambullida se descartó). Cada una tiene dos fases:
 * `out`, todavía en el showcase, y `in`, ya en la página del caso. Entre las
 * dos cambia la página, siempre tapada (por el velo de papel o por la card).
 *
 * - `open`: la card se abre en su página. Las demás cosas se apagan bajo un
 *   velo de papel, la card queda, y en la página del caso viaja hasta el
 *   lugar de su previsualización mientras el velo se va.
 * - `swallow`: los bordes se tragan el showcase. Las franjas crecen hasta
 *   juntarse en el centro, estirando todo, y la página del caso aparece
 *   cuando se retiran.
 */
export type TransitionKind = 'open' | 'swallow'

export const TRANSITION_KINDS: readonly { kind: TransitionKind; label: string }[] = [
  { kind: 'open', label: 'La card se abre en su página' },
  { kind: 'swallow', label: 'Los bordes se tragan el showcase' },
]

/** La que se usa (pedido del usuario, 2026-11-26). En desarrollo se puede probar la otra en el banco de pruebas. */
export const CASE_TRANSITION: TransitionKind = 'swallow'

export type TransitionPhase = 'idle' | 'out' | 'in'

/** Duración de cada fase (s). */
export const TRANSITION_DURATION: Record<TransitionKind, { out: number; in: number }> = {
  open: { out: 0.35, in: 0.75 },
  swallow: { out: 0.6, in: 0.7 },
}

/** Un rectángulo en la ventana: centro (origen en el centro de la ventana, y hacia arriba) y tamaño, px CSS. */
export interface ScreenRect {
  x: number
  y: number
  width: number
  height: number
}

/** Cómo se ve la transición en un momento. */
export interface TransitionView {
  /** Velo de papel sobre el contenido (0 a 1). */
  veil: number
  /** La card que viaja sobre el velo; `null` sin card. */
  card: ScreenRect | null
  /** Cuánto se tragan los bordes (0 a 1): las franjas llegan al centro. */
  swallow: number
}

export const IDLE_VIEW: TransitionView = { veil: 0, card: null, swallow: 0 }

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
/** Suave en los dos extremos. */
export const smooth = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
/** Arranca rápido y llega lento. */
export const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3
/** Arranca y llega lento. */
export const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function mixRect(a: ScreenRect, b: ScreenRect, t: number): ScreenRect {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) }
}

/**
 * Cómo se ve la transición: `from`, la card que se tocó; `to`, dónde queda en
 * la página del caso (la informa la página: hasta entonces, la fase `in` espera).
 */
export function transitionView(
  kind: TransitionKind,
  phase: TransitionPhase,
  t: number,
  from: ScreenRect | null,
  to: ScreenRect | null,
): TransitionView {
  if (phase === 'idle') return IDLE_VIEW
  if (kind === 'swallow') {
    // Afuera, las franjas se cierran y al final el papel tapa; adentro, al revés.
    return phase === 'out'
      ? { veil: smooth((t - 0.6) / 0.4), card: null, swallow: easeInOut(t) }
      : { veil: 1 - smooth(t / 0.45), card: null, swallow: 1 - easeOut(t) }
  }
  if (!from) return { veil: phase === 'out' ? smooth(t) : 1 - smooth(t), card: null, swallow: 0 }
  if (phase === 'out') return { veil: smooth(t), card: from, swallow: 0 }
  if (!to) return { veil: 1, card: from, swallow: 0 }
  return { veil: 1 - smooth((t - 0.3) / 0.7), card: mixRect(from, to, easeInOut(t)), swallow: 0 }
}

/** Las franjas, con lo que se tragan los bordes: en 1 llegan al centro (`along`: px de ventana en el eje del scroll). */
export function swallowBand(band: number, along: number, swallow: number): number {
  return mix(band, along / 2, swallow)
}

/** El look de los bordes mientras se tragan el contenido: más estirado, abierto, separado y difuso. */
export function swallowLook(look: WarpLook, swallow: number): WarpLook {
  if (swallow <= 0) return look
  const s = swallow
  return {
    ...look,
    stretch: mix(look.stretch, 0.95, s),
    spread: mix(look.spread, 3, s),
    aberration: mix(look.aberration, 1, s),
    split: mix(look.split, 40, s),
    blur: mix(look.blur, 80, s),
    ripple: mix(look.ripple, 24, s),
  }
}
