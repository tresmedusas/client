/**
 * Cómo se abre el modal de un fundador. De cuatro demos (pedido del usuario,
 * 2026-11-27), el usuario eligió `frost`; las otras, y el fundido de antes,
 * quedan en el banco de pruebas:
 *
 * - `fade`: la de antes. El modal aparece con un fundido y el haz se enciende
 *   desde el centro.
 * - `card`: la card se abre en el modal. El modal arranca recortado sobre la
 *   card del clic (con su radio) y crece hasta la pantalla mientras la foto
 *   pasa a tinta; al cerrar, vuelve a la card.
 * - `slit`: el haz abre la pantalla. Una línea de luz aparece a la altura del
 *   haz y se abre hacia arriba y hacia abajo como una rendija.
 * - `type`: tipográfica. El nombre gigante en contorno se dibuja trazo a trazo.
 * - `frost`: se desempaña, como Contacto. La página se esmerila y se oscurece,
 *   y el contenido llega fuera de foco y se aclara.
 *
 * El contenido (etiqueta, nombre, profesión y bio) puede entrar escalonado en
 * cualquiera de ellas.
 */
export type FounderOpen = 'fade' | 'card' | 'slit' | 'type' | 'frost'

export const FOUNDER_OPENS: readonly { kind: FounderOpen; label: string }[] = [
  { kind: 'fade', label: 'Fundido (la de antes)' },
  { kind: 'card', label: 'La card se abre en el modal' },
  { kind: 'slit', label: 'El haz abre la pantalla' },
  { kind: 'type', label: 'El nombre se dibuja' },
  { kind: 'frost', label: 'Se desempaña (la elegida)' },
]

/** La que se usa (pedido del usuario, 2026-11-27: se desempaña). En desarrollo, la del banco de pruebas. */
export const FOUNDER_OPEN: FounderOpen = 'frost'
/** El contenido entra escalonado. */
export const FOUNDER_STAGGER = false

/** Tiempos de cada apertura, en segundos. */
export interface OpenTiming {
  /** Lo que abre el modal (el recorte, el fundido, el esmerilado). */
  main: number
  /** Cuándo empieza lo que abre el modal. */
  mainDelay: number
  /** Cuándo empieza a encenderse el haz. */
  beamDelay: number
  /** Cuánto tarda el haz en llegar a los costados. */
  beam: number
  /** Cuándo empieza a entrar el contenido. */
  content: number
}

export const OPEN_TIMING: Record<FounderOpen, OpenTiming> = {
  fade: { main: 0.45, mainDelay: 0, beamDelay: 0, beam: 1.4, content: 0 },
  card: { main: 0.6, mainDelay: 0, beamDelay: 0.45, beam: 1.2, content: 0.4 },
  // Primero la línea de luz llega a los costados; después se abre la rendija.
  slit: { main: 0.7, mainDelay: 0.4, beamDelay: 0, beam: 0.5, content: 0.9 },
  type: { main: 1.6, mainDelay: 0, beamDelay: 0.3, beam: 1.4, content: 0.2 },
  frost: { main: 0.9, mainDelay: 0.25, beamDelay: 0.6, beam: 1.2, content: 0.3 },
}

/** Del contenido escalonado: cuánto tarda cada parte y cuánto después de la anterior sale la siguiente. */
export const STAGGER = { duration: 0.45, step: 0.06, rise: 8 }

/** Al cerrar, lo mismo al revés y más rápido. */
export const CLOSE_SPEED = 1.6

/** Un rectángulo en la ventana, en px CSS desde la esquina de arriba a la izquierda. */
export interface ViewportRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * El `clip-path` que recorta la pantalla al rectángulo de la card, con su
 * radio. Con el rectángulo de la ventana entera queda sin recorte.
 */
export function cardClip(rect: ViewportRect, viewportWidth: number, viewportHeight: number, radius: number): string {
  const r = (n: number) => `${Math.round(n * 100) / 100}px`
  const top = rect.top
  const right = viewportWidth - (rect.left + rect.width)
  const bottom = viewportHeight - (rect.top + rect.height)
  return `inset(${r(top)} ${r(right)} ${r(bottom)} ${r(rect.left)} round ${r(radius)})`
}

/** Una línea a `fromTop` (fracción del alto) que se abre hasta la pantalla entera. */
export function slitClip(fromTop: number, open: boolean): string {
  if (open) return 'inset(0% 0% 0% 0%)'
  const top = Math.round(fromTop * 1000) / 10
  return `inset(calc(${top}% - 1px) 0% calc(${Math.round((100 - top) * 10) / 10}% - 1px) 0%)`
}
