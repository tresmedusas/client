import { describe, expect, it } from 'vitest'
import { MOMENTUM } from './deck-logic.js'
import { Deck } from './deck.svelte.js'

/** Deck de `count` escenas que entran en una ventana de 800 px: cada transición recorre 800 px. */
function deckOf(count: number): Deck {
  const deck = new Deck()
  deck.reset(count)
  deck.setViewport(800)
  for (let i = 0; i < count; i++) deck.setFrame(i, 100, 500, 0)
  return deck
}

/** Avanza el deck a 60 fps hasta que se detiene (o `seconds`) y devuelve las posiciones de cada frame. */
function run(deck: Deck, seconds = 5): number[] {
  const out: number[] = []
  for (let t = 0; t < seconds && deck.moving; t += 1 / 60) {
    deck.advance(1 / 60)
    out.push(deck.position)
  }
  return out
}

/** Arrastre de `from` a `to` (px) en `ms`, con eventos cada 16 ms; suelta enseguida. */
function drag(deck: Deck, from: number, to: number, ms: number): void {
  deck.dragStart(from, 0)
  const n = Math.max(2, Math.round(ms / 16))
  for (let k = 1; k <= n; k++) deck.dragMove(from + ((to - from) * k) / n, k * 16)
  deck.dragEnd(n * 16)
}

describe('Deck como página', () => {
  it('la rueda mueve el contenido lo que dice, sin encajar en una escena', () => {
    const deck = deckOf(4)
    deck.wheel(100)
    deck.wheel(100)
    deck.wheel(100)
    run(deck)
    expect(deck.position).toBeCloseTo(300 / 800)
    expect(deck.shift(0)).toBeCloseTo(300)
    expect(deck.index).toBe(0)
  })

  it('el arrastre sigue al dedo 1:1', () => {
    const deck = deckOf(4)
    deck.dragStart(600, 0)
    deck.dragMove(400, 100)
    expect(deck.shift(0)).toBeCloseTo(200)
    expect(deck.shift(1)).toBeCloseTo(200 - 800)
  })

  it('al soltar un fling sigue con inercia, sin frenar en seco ni volver', () => {
    const deck = deckOf(4)
    // 160 px en 80 ms: ~2000 px/s.
    drag(deck, 600, 440, 80)
    const released = deck.position
    deck.advance(1 / 60)
    const firstStep = (deck.position - released) * 800
    // A ~2000 px/s, un frame recorre ~30 px: arranca con la velocidad del dedo.
    expect(firstStep).toBeGreaterThan(20)
    const path = run(deck)
    for (let k = 1; k < path.length; k++) expect(path[k]!).toBeGreaterThanOrEqual(path[k - 1]! - 1e-9)
    // Recorre ~velocidad · τ más allá de donde se soltó.
    const glide = (deck.position - released) * 800
    expect(glide).toBeGreaterThan(2000 * MOMENTUM * 0.6)
    expect(glide).toBeLessThan(2000 * MOMENTUM * 1.2)
  })

  it('un dedo que se queda quieto antes de soltar no tira inercia', () => {
    const deck = deckOf(4)
    deck.dragStart(600, 0)
    deck.dragMove(500, 16)
    deck.dragEnd(500)
    expect(deck.moving).toBe(false)
    expect(deck.shift(0)).toBeCloseTo(100)
  })

  it('estirado más allá del principio, vuelve', () => {
    const deck = deckOf(4)
    drag(deck, 300, 500, 200)
    expect(deck.position).toBeLessThan(0)
    run(deck)
    expect(deck.position).toBe(0)
  })

  it('goTo lleva al comienzo de la escena; con `instant`, sin animar', () => {
    const deck = deckOf(4)
    deck.goTo(2)
    run(deck)
    expect(deck.position).toBe(2)
    deck.instant = true
    deck.goTo(0)
    expect(deck.position).toBe(0)
  })

  it('una escena alta scrollea adentro y después pasa a la siguiente', () => {
    const deck = deckOf(3)
    deck.setFrame(1, 96, 1200, 400)
    deck.goTo(1, true)
    deck.wheel(300)
    run(deck)
    expect(deck.position).toBe(1)
    expect(deck.innerOf(1)).toBeCloseTo(300)
    deck.wheel(300)
    run(deck)
    expect(deck.innerOf(1)).toBe(400)
    expect(deck.position).toBeGreaterThan(1)
  })

  it('la rueda durante un goTo arranca de donde está la página', () => {
    const deck = deckOf(4)
    deck.goTo(3)
    for (let k = 0; k < 6; k++) deck.advance(1 / 60)
    const at = deck.position
    deck.wheel(-100)
    run(deck)
    expect(deck.position).toBeCloseTo(at - 100 / 800, 1)
  })
})

describe('Arrastre de costado (swipeX)', () => {
  /** Arrastre de costado de `fromX` a `toX` con el dedo a la misma altura. */
  function swipe(deck: Deck, fromX: number, toX: number): void {
    deck.dragStart(400, 0, fromX)
    for (let k = 1; k <= 10; k++) deck.dragMove(400, k * 16, fromX + ((toX - fromX) * k) / 10)
  }

  it('sin swipeX, un arrastre de costado no mueve nada ni cuenta como arrastre', () => {
    const deck = deckOf(3)
    swipe(deck, 600, 300)
    expect(deck.position).toBe(0)
    expect(deck.dragged).toBe(false)
  })

  it('con swipeX, arrastrar hacia la izquierda baja por la página', () => {
    const deck = deckOf(3)
    deck.swipeX = true
    swipe(deck, 600, 300)
    expect(deck.dragged).toBe(true)
    expect(deck.position).toBeCloseTo(300 / 800, 2)
  })

  it('con swipeX, un arrastre vertical sigue siendo vertical', () => {
    const deck = deckOf(3)
    deck.swipeX = true
    deck.dragStart(600, 0, 400)
    for (let k = 1; k <= 10; k++) deck.dragMove(600 - 20 * k, k * 16, 400 + k)
    expect(deck.position).toBeCloseTo(200 / 800, 2)
  })
})

describe('Recorrido horizontal de una escena', () => {
  it('el alto y el scroll interno extra no cambian dónde termina la escena en pantalla', () => {
    const plain = deckOf(2)
    const tracked = new Deck()
    tracked.reset(2)
    tracked.setViewport(800)
    tracked.setFrame(0, 100, 500 + 900, 900)
    tracked.setFrame(1, 100, 500, 0)
    // El recorrido horizontal se scrollea antes de la transición.
    tracked.wheel(900)
    run(tracked)
    expect(tracked.innerOf(0)).toBeCloseTo(900)
    expect(tracked.position).toBe(0)
    // Y después, la transición mide lo mismo que sin recorrido.
    tracked.wheel(400)
    plain.wheel(400)
    run(tracked)
    run(plain)
    expect(tracked.position).toBeCloseTo(plain.position)
  })
})
