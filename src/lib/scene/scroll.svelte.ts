// Adaptado de `apps/site/src/lib/scene/scroll.svelte.ts` del repo de Essentia.
import { Spring } from 'essentia-core'

/** Píxeles de arrastre a partir de los cuales un gesto deja de ser un tap. */
const TAP_SLOP = 6

/** Cuánto sigue el fling después de soltar: distancia = velocidad · FLING_TIME. */
const FLING_TIME = 0.35

/**
 * Scroll vertical del contenido de la escena (rueda, arrastre y teclado).
 *
 * El contenido es parte de la escena 3D (así el Glass lo refracta), no un
 * documento con scroll del navegador: `offset` es cuánto subió el contenido,
 * en píxeles CSS. La rueda y el fling mueven el `target` de un `Spring`
 * críticamente amortiguado y `step()` lo avanza desde un `useTask` que corre
 * solo mientras `moving` es `true`; durante el arrastre el valor sigue al dedo
 * sin resorte. En reposo no hay task ni frames de más.
 */
export class ScrollState {
  /** Desplazamiento actual del contenido en píxeles CSS (0 = arriba). */
  offset = $state(0)
  /** `true` mientras el resorte no llegó al target: la task de scroll corre. */
  moving = $state(false)
  /** `true` si el último gesto de arrastre superó el umbral de tap. */
  dragged = $state(false)
  /** Hasta dónde va el scroll: se adelanta a `offset` mientras corre el resorte. */
  destination = $state(0)
  /** Máximo desplazamiento en píxeles CSS. */
  max = $state(0)

  private _max = 0
  private readonly _spring = new Spring({ stiffness: 16, precision: 0.05 })
  private _drag: { startY: number; startOffset: number; lastY: number; lastT: number; velocity: number } | null = null

  /** Máximo desplazamiento: alto del contenido menos el área visible. */
  setMax(max: number): void {
    this._max = Math.max(0, max)
    this.max = this._max
    if (this._spring.target > this._max) this.scrollTo(this._max)
  }

  /** Delta de rueda en píxeles CSS (positivo = el contenido sube). */
  wheel(delta: number): void {
    this.scrollTo(this._spring.target + delta)
  }

  /** Lleva el scroll a `offset` con el resorte. */
  scrollTo(offset: number): void {
    this._spring.target = this.clamp(offset)
    this.destination = this._spring.target
    this.moving = !this._spring.settled
  }

  /** Lleva el scroll a `offset` sin resorte: una página nueva arranca quieta. */
  jumpTo(offset: number): void {
    this._spring.set(this.clamp(offset))
    this.offset = this._spring.value
    this.destination = this.offset
    this.moving = false
  }

  dragStart(clientY: number, timeStamp: number): void {
    this._spring.set(this._spring.value)
    this.moving = false
    this.dragged = false
    this._drag = { startY: clientY, startOffset: this.offset, lastY: clientY, lastT: timeStamp, velocity: 0 }
  }

  dragMove(clientY: number, timeStamp: number): void {
    const drag = this._drag
    if (!drag) return
    // Arrastrar hacia arriba (clientY baja) sube el contenido.
    if (Math.abs(clientY - drag.startY) > TAP_SLOP) this.dragged = true
    const dt = (timeStamp - drag.lastT) / 1000
    if (dt > 0) {
      // Velocidad suavizada en px/s, para que el último evento no decida solo el fling.
      drag.velocity = drag.velocity * 0.6 + ((drag.lastY - clientY) / dt) * 0.4
    }
    drag.lastY = clientY
    drag.lastT = timeStamp
    this._spring.set(this.clamp(drag.startOffset + drag.startY - clientY))
    this.offset = this._spring.value
    this.destination = this.offset
  }

  dragEnd(): void {
    const drag = this._drag
    if (!drag) return
    this._drag = null
    if (this.dragged) this.scrollTo(this.offset + drag.velocity * FLING_TIME)
  }

  /** Avanza el resorte `dt` segundos. Lo llama el `useTask` mientras `moving`. */
  step(dt: number): void {
    this.offset = this._spring.step(dt)
    if (this._spring.settled) this.moving = false
  }

  private clamp(offset: number): number {
    return Math.min(this._max, Math.max(0, offset))
  }
}
