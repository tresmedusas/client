import { Spring } from 'essentia-core'
import { WHEEL_GAP, WHEEL_THRESHOLD, clamp, dragOffset, releaseTarget, travel } from './deck-logic.js'

/** Cuánto sigue el scroll interno después de soltar: distancia = velocidad · FLING_TIME. */
const FLING_TIME = 0.35
/** Píxeles de arrastre a partir de los cuales un gesto deja de ser un tap. */
const TAP_SLOP = 6

/**
 * Deck de escenas a pantalla completa: la página es una pila de escenas y la
 * rueda, el arrastre y el teclado pasan de una a otra.
 *
 * `position` es la escena que se ve, en escenas y con decimales durante la
 * transición: la escena `i` está corrida `position − i` pantallas. Lo anima un
 * `Spring` críticamente amortiguado que avanza `step()` desde un `useTask` que
 * corre solo mientras `moving`: en reposo no hay frames de más.
 *
 * Una escena más alta que la ventana (en un teléfono) scrollea adentro antes de
 * pasar a la siguiente: ese scroll interno es `inner[i]`, en píxeles CSS.
 *
 * Las dos escenas de una transición se corren la misma distancia (`travel`),
 * medida con lo que ocupan en pantalla: así una escena alta sale entera y la
 * siguiente nunca la pisa.
 */
export class Deck {
  /** Cantidad de escenas de la página. */
  count = $state(1)
  /** Escena a la que va el deck. */
  index = $state(0)
  /** Escena que se ve, con decimales durante la transición. */
  position = $state(0)
  /** Velocidad del deck en escenas/s: el fondo la usa para la estela. */
  velocity = $state(0)
  /** Scroll interno de cada escena, en píxeles CSS. */
  inner = $state<number[]>([])
  /** `true` mientras algún resorte no llegó a su target: la task corre. */
  moving = $state(false)
  /** `true` si el último arrastre superó el umbral de tap. */
  dragged = $state(false)
  /** Dónde queda el contenido de cada escena: su tope en la ventana y su alto. */
  frames = $state<{ top: number; height: number }[]>([])
  /** Alto de la ventana, en píxeles CSS. */
  viewport = $state(1)

  private readonly _position = new Spring({ stiffness: 7, precision: 0.0005 })
  private readonly _inner = new Spring({ stiffness: 16, precision: 0.05 })
  private _overflow: number[] = []
  private readonly _wheel = { last: -Infinity, accum: 0, locked: false }
  private _drag: { startY: number; startInner: number; lastY: number; lastT: number; velocity: number } | null = null

  /** Cambia de página: otra cantidad de escenas, y arranca quieta en `start`. */
  reset(count: number, start = 0): void {
    this.count = Math.max(1, count)
    this._overflow = Array.from({ length: this.count }, () => 0)
    this.inner = Array.from({ length: this.count }, () => 0)
    this.frames = Array.from({ length: this.count }, () => ({ top: 0, height: 0 }))
    this.goTo(start, true)
  }

  setViewport(height: number): void {
    this.viewport = Math.max(1, height)
  }

  /**
   * Dónde quedó el contenido de la escena `i`: su tope en la ventana, su alto
   * y los píxeles que no entran (el recorrido de su scroll interno).
   */
  setFrame(i: number, top: number, height: number, overflow: number): void {
    const frame = this.frames[i]
    if (frame && (frame.top !== top || frame.height !== height)) this.frames[i] = { top, height }
    this._overflow[i] = Math.max(0, overflow)
    if ((this.inner[i] ?? 0) > this._overflow[i]!) {
      this.inner[i] = this._overflow[i]!
      if (i === this.index) this._inner.set(this._overflow[i]!)
    }
  }

  innerOf(i: number): number {
    return this.inner[i] ?? 0
  }

  /**
   * Cuánto está corrida la escena `i` de su lugar, en píxeles (positivo: hacia
   * arriba). Usa la distancia del par que está en transición: el de `i` y la
   * siguiente si `i` ya empezó a salir, o el de la anterior y `i` si todavía
   * no entró.
   */
  shift(i: number): number {
    const d = this.position - i
    if (d === 0) return 0
    const upper = d > 0 ? i : i - 1
    return d * this.travelOf(upper)
  }

  /** Distancia de la transición entre la escena `upper` y la siguiente. */
  private travelOf(upper: number): number {
    const a = this.frames[upper]
    const b = this.frames[upper + 1]
    if (!a || !b) return this.viewport
    return travel(this.viewport, a.top + a.height - this.innerOf(upper), b.top - this.innerOf(upper + 1))
  }

  /** Lleva el deck a la escena `i`; con `jump`, sin transición. */
  goTo(i: number, jump = false): void {
    const target = clamp(Math.round(i), 0, this.count - 1)
    const previous = this.index
    this.index = target
    if (target !== previous || jump) {
      // Hacia adelante la escena arranca arriba; hacia atrás, en su final.
      const start = target < previous && !jump ? (this._overflow[target] ?? 0) : 0
      this._inner.set(start)
      this.inner[target] = start
    }
    this._position.target = target
    if (jump) {
      this._position.set(target)
      this.position = target
      this.velocity = 0
    }
    this.moving = !this._position.settled || !this._inner.settled
  }

  next(): void {
    this.goTo(this.index + 1)
  }

  previous(): void {
    this.goTo(this.index - 1)
  }

  /**
   * Delta de rueda en píxeles (positivo = hacia la siguiente) en el instante
   * `now` (ms). El scroll interno se consume primero; después, un gesto pasa
   * de escena una sola vez.
   */
  wheel(delta: number, now: number): void {
    const wheel = this._wheel
    const gap = now - wheel.last
    wheel.last = now
    if (wheel.locked) {
      if (gap < WHEEL_GAP) return
      wheel.locked = false
    }
    if (gap >= WHEEL_GAP) wheel.accum = 0
    // Con la transición recién empezada, un gesto nuevo espera.
    if (Math.abs(this.position - this.index) > 0.5) return
    if (this.scrollInner(delta)) {
      wheel.accum = 0
      return
    }
    wheel.accum += delta
    if (Math.abs(wheel.accum) < WHEEL_THRESHOLD) return
    const before = this.index
    this.goTo(this.index + Math.sign(wheel.accum))
    wheel.accum = 0
    wheel.locked = this.index !== before
  }

  /** Teclado: un paso de `pixels` por el scroll interno, o la escena vecina si no queda. */
  step(pixels: number): void {
    if (!this.scrollInner(pixels)) this.goTo(this.index + Math.sign(pixels))
  }

  dragStart(clientY: number, timeStamp: number): void {
    // Tomar el deck a mitad de una transición lo deja en la escena más cercana.
    this.index = clamp(Math.round(this.position), 0, this.count - 1)
    this._position.set(this.position)
    this._inner.set(this.innerOf(this.index))
    this.moving = false
    this.dragged = false
    this._drag = { startY: clientY, startInner: this.innerOf(this.index), lastY: clientY, lastT: timeStamp, velocity: 0 }
  }

  dragMove(clientY: number, timeStamp: number): void {
    const drag = this._drag
    if (!drag) return
    if (Math.abs(clientY - drag.startY) > TAP_SLOP) this.dragged = true
    const dt = (timeStamp - drag.lastT) / 1000
    // Velocidad suavizada en px/s (positiva hacia la siguiente), para que el último evento no decida solo.
    if (dt > 0) drag.velocity = drag.velocity * 0.6 + ((drag.lastY - clientY) / dt) * 0.4
    drag.lastY = clientY
    drag.lastT = timeStamp
    // Arrastrar hacia arriba avanza: primero el scroll interno, después el deck.
    const wanted = drag.startInner + drag.startY - clientY
    const max = this._overflow[this.index] ?? 0
    const inner = clamp(wanted, 0, max)
    this._inner.set(inner)
    this.inner[this.index] = inner
    const position = this.index + dragOffset(this.index, wanted - inner, this.viewport, this.count)
    this._position.set(position)
    this.position = position
  }

  dragEnd(): void {
    const drag = this._drag
    if (!drag) return
    this._drag = null
    if (!this.dragged) return
    const offset = this.position - this.index
    const target = releaseTarget(this.index, offset, drag.velocity / this.viewport, this.count)
    if (target === this.index && Math.abs(offset) < 0.001) {
      // Solo scroll interno: el fling lo sigue.
      this._inner.target = clamp(this.innerOf(this.index) + drag.velocity * FLING_TIME, 0, this._overflow[this.index] ?? 0)
    }
    this.goTo(target)
  }

  /** Avanza los resortes `dt` segundos. Lo llama el `useTask` mientras `moving`. */
  advance(dt: number): void {
    this.position = this._position.step(dt)
    this.velocity = this._position.velocity
    this.inner[this.index] = this._inner.step(dt)
    if (this._position.settled && this._inner.settled) {
      this.moving = false
      this.velocity = 0
    }
  }

  /** Mueve el scroll interno si le queda recorrido en esa dirección; `false` si no. */
  private scrollInner(delta: number): boolean {
    const max = this._overflow[this.index] ?? 0
    const target = this._inner.target
    if ((delta > 0 && target >= max - 0.5) || (delta < 0 && target <= 0.5) || delta === 0) return false
    this._inner.target = clamp(target + delta, 0, max)
    this.moving = true
    return true
  }
}
