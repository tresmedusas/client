import { Spring } from 'essentia-core'
import {
  DECK_STIFFNESS,
  EDGE_RESISTANCE,
  MOMENTUM,
  SCROLL_STIFFNESS,
  clamp,
  launchVelocity,
  locate,
  pageLayout,
  scrollAt,
  scrollOf,
  travel,
  type PageLayout,
} from './deck-logic.js'

/** Píxeles de arrastre a partir de los cuales un gesto deja de ser un tap. */
const TAP_SLOP = 6
/** Un dedo quieto más que esto (ms) antes de soltar no tira inercia. */
const RELEASE_STALE = 90
/** Frecuencia (rad/s) con la que vuelve un arrastre estirado más allá del principio o el final. */
const BOUNCE_STIFFNESS = 12

/**
 * Deck de escenas a pantalla completa, que se scrollea como una página: la
 * rueda, el trackpad y el dedo mueven el contenido 1:1 y al soltar sigue con
 * inercia, sin encajar en ninguna escena.
 *
 * Por dentro es un solo scroll en píxeles (ver `pageLayout`): cada escena
 * recorre primero su scroll interno (lo que no entra en la ventana, en un
 * teléfono) y después la transición a la siguiente. De ese scroll salen
 * `position` (la escena que se ve, con decimales durante la transición) e
 * `inner` (el scroll interno de cada escena). Lo anima un `Spring` que avanza
 * desde un `useTask` que corre solo mientras `moving`: en reposo no hay
 * frames de más.
 *
 * Las dos escenas de una transición se corren la misma distancia (`travel`),
 * medida con lo que ocupan en pantalla: así una escena alta sale entera y la
 * siguiente nunca la pisa.
 */
export class Deck {
  /** Cantidad de escenas de la página. */
  count = $state(1)
  /** Escena que se ve (la más cercana a `position`). */
  index = $state(0)
  /** Escena que se ve, con decimales durante la transición. */
  position = $state(0)
  /** Velocidad del deck en escenas/s: el fondo la usa para la estela. */
  velocity = $state(0)
  /** Scroll interno de cada escena, en píxeles CSS. */
  inner = $state<number[]>([])
  /** `true` mientras el scroll no llegó a su destino: la task corre. */
  moving = $state(false)
  /** `true` si el último arrastre superó el umbral de tap. */
  dragged = $state(false)
  /** Dónde queda el contenido de cada escena: su tope en la ventana y su alto. */
  frames = $state<{ top: number; height: number }[]>([])
  /** Alto de la ventana, en píxeles CSS. */
  viewport = $state(1)
  /** Movimiento reducido: ir a una escena salta sin animar (el scroll sigue siendo scroll). */
  instant = false

  private readonly _scroll = new Spring({ stiffness: SCROLL_STIFFNESS, precision: 0.1 })
  /** `true` si el resorte va a una escena o sigue una inercia: la rueda arranca de donde está. */
  private _gliding = false
  private _overflow: number[] = [0]
  private _layout: PageLayout = pageLayout([0], [])
  private _drag: { startY: number; startScroll: number; lastY: number; lastT: number; velocity: number } | null = null

  /** Cambia de página: otra cantidad de escenas, y arranca quieta en `start`. */
  reset(count: number, start = 0): void {
    this.count = Math.max(1, count)
    this._overflow = Array.from({ length: this.count }, () => 0)
    this.inner = Array.from({ length: this.count }, () => 0)
    this.frames = Array.from({ length: this.count }, () => ({ top: 0, height: 0 }))
    this._drag = null
    this._layout = this.measure()
    this._scroll.set(scrollOf(this._layout, start))
    this._gliding = false
    this.sync()
    this.moving = false
    this.velocity = 0
  }

  setViewport(height: number): void {
    const next = Math.max(1, height)
    if (next === this.viewport) return
    this.viewport = next
    this.relayout()
  }

  /**
   * Dónde quedó el contenido de la escena `i`: su tope en la ventana, su alto
   * y los píxeles que no entran (el recorrido de su scroll interno).
   */
  setFrame(i: number, top: number, height: number, overflow: number): void {
    const frame = this.frames[i]
    if (!frame) return
    const o = Math.max(0, overflow)
    if (frame.top === top && frame.height === height && this._overflow[i] === o) return
    this.frames[i] = { top, height }
    this._overflow[i] = o
    this.relayout()
  }

  innerOf(i: number): number {
    return this.inner[i] ?? 0
  }

  /**
   * Cuánto está corrida la escena `i` de su lugar, en píxeles (positivo: hacia
   * arriba). Usa la distancia del par que está en transición: el de `i` y la
   * siguiente si `i` ya empezó a salir, o el de la anterior y `i` si todavía
   * no entró. Más allá del principio o del final, una pantalla.
   */
  shift(i: number): number {
    const d = this.position - i
    if (d === 0) return 0
    const upper = d > 0 ? i : i - 1
    return d * (this._layout.travels[upper] ?? this.viewport)
  }

  /** Lleva la página al comienzo de la escena `i`; con `jump` (o con `instant`), sin animar. */
  goTo(i: number, jump = this.instant): void {
    this._drag = null
    const target = scrollOf(this._layout, i)
    this._scroll.stiffness = DECK_STIFFNESS
    this._scroll.target = target
    this._gliding = true
    if (jump) this._scroll.set(target)
    this.sync()
    this.moving = !this._scroll.settled
    if (!this.moving) this.velocity = 0
  }

  next(): void {
    this.goTo(this.index + 1)
  }

  previous(): void {
    this.goTo(this.index - 1)
  }

  /** Delta de rueda en píxeles (positivo = hacia abajo de la página). */
  wheel(delta: number, _now?: number): void {
    if (this._drag || delta === 0) return
    this.scrollBy(delta)
  }

  /** Teclado: un paso de `pixels` (positivo = hacia abajo de la página). */
  step(pixels: number): void {
    if (this._drag) return
    this.scrollBy(pixels)
  }

  dragStart(clientY: number, timeStamp: number): void {
    // Tomar la página en movimiento la frena donde está.
    this._scroll.set(this._scroll.value)
    this._gliding = false
    this.moving = false
    this.velocity = 0
    this.dragged = false
    this._drag = { startY: clientY, startScroll: this._scroll.value, lastY: clientY, lastT: timeStamp, velocity: 0 }
  }

  dragMove(clientY: number, timeStamp: number): void {
    const drag = this._drag
    if (!drag) return
    if (Math.abs(clientY - drag.startY) > TAP_SLOP) this.dragged = true
    const dt = (timeStamp - drag.lastT) / 1000
    // Velocidad suavizada en px/s (positiva hacia abajo de la página), para que el último evento no decida solo.
    if (dt > 0) drag.velocity = drag.velocity * 0.6 + ((drag.lastY - clientY) / dt) * 0.4
    drag.lastY = clientY
    drag.lastT = timeStamp
    // Arrastrar hacia arriba baja por la página; más allá de los bordes, con resistencia.
    const wanted = drag.startScroll + drag.startY - clientY
    const total = this._layout.total
    const scroll = wanted < 0 ? wanted * EDGE_RESISTANCE : wanted > total ? total + (wanted - total) * EDGE_RESISTANCE : wanted
    this._scroll.set(scroll)
    this.sync()
    this.velocity = drag.velocity / this.viewport
  }

  /** Suelta el arrastre; `timeStamp` (ms) descarta la velocidad de un dedo que ya se había quedado quieto. */
  dragEnd(timeStamp?: number): void {
    const drag = this._drag
    if (!drag) return
    this._drag = null
    const value = this._scroll.value
    const total = this._layout.total
    if (value < 0 || value > total) {
      // Estirado más allá del borde: vuelve.
      this._scroll.stiffness = BOUNCE_STIFFNESS
      this._scroll.target = clamp(value, 0, total)
    } else if (this.dragged) {
      const stale = timeStamp !== undefined && timeStamp - drag.lastT > RELEASE_STALE
      const v = stale ? 0 : drag.velocity
      const target = clamp(value + v * MOMENTUM, 0, total)
      const remaining = target - value
      // Inercia: con ω = 1/τ y la velocidad del dedo, el resorte decae como
      // e^(−t/τ), como el scroll nativo. Si el final de la página corta el
      // recorrido, más rígido, para llegar justo sin frenar en seco.
      const stiffness = remaining !== 0 ? Math.max(1 / MOMENTUM, Math.abs(v / remaining)) : 1 / MOMENTUM
      this._scroll.stiffness = stiffness
      this._scroll.target = target
      launch(this._scroll, launchVelocity(remaining, v, stiffness))
    }
    this._gliding = true
    this.moving = !this._scroll.settled
    if (!this.moving) this.velocity = 0
  }

  /** Avanza el scroll `dt` segundos. Lo llama el `useTask` mientras `moving`. */
  advance(dt: number): void {
    this._scroll.step(dt)
    this.sync()
    this.velocity = this._scroll.velocity / this.viewport
    if (this._scroll.settled) {
      this.moving = false
      this.velocity = 0
      this._gliding = false
    }
  }

  /** Scroll de rueda o teclado: suma al destino, o arranca de donde está si iba a otro lado. */
  private scrollBy(delta: number): void {
    const from = this._gliding ? this._scroll.value : this._scroll.target
    this._scroll.stiffness = SCROLL_STIFFNESS
    this._scroll.target = clamp(from + delta, 0, this._layout.total)
    this._gliding = false
    this.moving = !this._scroll.settled
  }

  /** `position`, `index` e `inner` a partir del scroll. */
  private sync(): void {
    const value = this._scroll.value
    const layout = this._layout
    const spot = locate(layout, value)
    let position = spot.position
    // Estirado más allá de los bordes (arrastre): la página sigue al dedo.
    if (value < 0) position = value / this.viewport
    else if (value > layout.total) position = spot.position + (value - layout.total) / this.viewport
    this.position = position
    this.index = clamp(Math.round(position), 0, this.count - 1)
    for (let j = 0; j < this.count; j++) {
      const inner = j < spot.scene ? (this._overflow[j] ?? 0) : j === spot.scene ? spot.inner : 0
      if (this.inner[j] !== inner) this.inner[j] = inner
    }
  }

  /** Rehace el layout con las medidas nuevas, sin mover lo que se ve. */
  private relayout(): void {
    const old = this._layout
    const value = this._scroll.value
    const valueSpot = locate(old, value)
    const targetSpot = locate(old, this._scroll.target)
    const velocity = this._scroll.velocity
    this._layout = this.measure()
    const next = this._layout
    // Lo que se ve queda en su lugar; fuera de los bordes (arrastrando), igual de estirado.
    const over = value < 0 ? value : value > old.total ? value - old.total : 0
    const base = scrollAt(next, valueSpot)
    this._scroll.set(base + over)
    this._scroll.target = scrollAt(next, targetSpot)
    launch(this._scroll, velocity)
    if (this._drag) this._drag.startScroll += this._scroll.value - value
    this.sync()
    this.moving = !this._scroll.settled
  }

  /** Layout de la página con los frames y el viewport actuales. */
  private measure(): PageLayout {
    const travels: number[] = []
    for (let i = 0; i < this.count - 1; i++) {
      const a = this.frames[i]
      const b = this.frames[i + 1]
      travels.push(
        a && b && a.height > 0 && b.height > 0
          ? travel(this.viewport, a.top + a.height - (this._overflow[i] ?? 0), b.top)
          : this.viewport,
      )
    }
    return pageLayout(this._overflow.slice(0, this.count), travels)
  }
}

/**
 * Le da velocidad inicial a un `Spring` de Essentia, que no la expone: `set`
 * la pone en 0. Con la solución cerrada del resorte, basta con escribirla.
 * TODO: reemplazar por `spring.set(value, velocity)` cuando Essentia lo tenga.
 */
function launch(spring: Spring, velocity: number): void {
  if (velocity === 0) return
  ;(spring as unknown as { _velocity: number })._velocity = velocity
}
