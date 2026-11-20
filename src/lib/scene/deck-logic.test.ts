import { describe, expect, it } from 'vitest'
import {
  DECK_STIFFNESS,
  SCENE_GAP,
  launchVelocity,
  locate,
  pageLayout,
  sceneFrame,
  sceneIndex,
  scrollAt,
  scrollOf,
  travel,
} from './deck-logic.js'

describe('sceneFrame', () => {
  it('centra en el área lo que entra', () => {
    expect(sceneFrame(400, 900, 88, 40)).toEqual({ top: 88 + (900 - 88 - 40 - 400) / 2, overflow: 0 })
  })

  it('lo que no entra va arriba y scrollea adentro', () => {
    const frame = sceneFrame(1200, 800, 88, 40)
    expect(frame.top).toBe(96)
    expect(frame.overflow).toBe(1200 - (800 - 88 - 40) + 8)
  })
})

describe('sceneIndex', () => {
  it('acepta el ancla con o sin #', () => {
    expect(sceneIndex(['inicio', 'nosotros'], '#nosotros')).toBe(1)
    expect(sceneIndex(['inicio', 'nosotros'], 'inicio')).toBe(0)
    expect(sceneIndex(['inicio'], 'x')).toBe(-1)
  })
})

describe('travel', () => {
  it('una pantalla entre escenas que entran en la ventana', () => {
    expect(travel(800, 700, 120)).toBe(800)
  })

  it('lo bastante para que una escena alta salga entera', () => {
    expect(travel(800, 1500, 96)).toBe(1500)
  })

  it('la de abajo nunca pisa a la de arriba', () => {
    // La de abajo vuelve con scroll interno: su tope está arriba de la ventana.
    const upperBottom = 760
    const lowerTop = -300
    const d = travel(800, upperBottom, lowerTop)
    for (let p = 0; p <= 1; p += 0.1) expect(lowerTop + (1 - p) * d - (upperBottom - p * d)).toBeGreaterThanOrEqual(SCENE_GAP - 1e-9)
  })
})

describe('pageLayout', () => {
  // Tres escenas: la del medio no entra (200 px de scroll interno).
  const layout = pageLayout([0, 200, 0], [800, 900])

  it('cada escena empieza después del scroll interno y la transición de la anterior', () => {
    expect(layout.starts).toEqual([0, 800, 800 + 200 + 900])
    expect(layout.total).toBe(1900)
  })

  it('locate: scroll interno y transición, 1:1 con los píxeles', () => {
    expect(locate(layout, 400)).toEqual({ position: 0.5, scene: 0, inner: 0 })
    expect(locate(layout, 900)).toEqual({ position: 1, scene: 1, inner: 100 })
    expect(locate(layout, 1000 + 450)).toEqual({ position: 1.5, scene: 1, inner: 200 })
    expect(locate(layout, 5000)).toEqual({ position: 2, scene: 2, inner: 0 })
    expect(locate(layout, -50)).toEqual({ position: 0, scene: 0, inner: 0 })
  })

  it('scrollOf y scrollAt son la inversa de locate', () => {
    expect(scrollOf(layout, 2)).toBe(1900)
    expect(scrollOf(layout, 1, 50)).toBe(850)
    for (const scroll of [0, 123, 800, 950, 1000, 1400, 1900]) expect(scrollAt(layout, locate(layout, scroll))).toBeCloseTo(scroll)
  })

  it('un layout nuevo mantiene lo que se ve', () => {
    const spot = locate(layout, 1450)
    const taller = pageLayout([0, 260, 0], [800, 900])
    expect(locate(taller, scrollAt(taller, spot))).toEqual({ position: 1.5, scene: 1, inner: 260 })
  })
})

describe('launchVelocity', () => {
  it('sigue la velocidad del dedo hacia el target', () => {
    expect(launchVelocity(80, 200, DECK_STIFFNESS)).toBe(200)
    expect(launchVelocity(-80, -200, DECK_STIFFNESS)).toBe(-200)
  })

  it('no empuja en contra del target', () => {
    expect(launchVelocity(80, -200, DECK_STIFFNESS)).toBe(0)
    expect(launchVelocity(0, 200, DECK_STIFFNESS)).toBe(0)
  })

  it('se limita para que el resorte no se pase', () => {
    const v = launchVelocity(10, 5000, DECK_STIFFNESS)
    expect(v).toBe(DECK_STIFFNESS * 10)
  })
})
