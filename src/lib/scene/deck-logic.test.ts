import { describe, expect, it } from 'vitest'
import { DRAG_COMMIT, EDGE_RESISTANCE, SCENE_GAP, dragOffset, releaseTarget, sceneFrame, sceneIndex, travel } from './deck-logic.js'

describe('releaseTarget', () => {
  it('vuelve a la escena si el arrastre fue corto y lento', () => {
    expect(releaseTarget(1, DRAG_COMMIT * 0.5, 0.1, 4)).toBe(1)
  })

  it('pasa a la siguiente con un tramo largo o un fling', () => {
    expect(releaseTarget(1, DRAG_COMMIT + 0.01, 0, 4)).toBe(2)
    expect(releaseTarget(1, 0.05, 2, 4)).toBe(2)
  })

  it('vuelve a la anterior hacia arriba', () => {
    expect(releaseTarget(2, -0.3, 0, 4)).toBe(1)
  })

  it('no sale del deck', () => {
    expect(releaseTarget(3, 0.5, 3, 4)).toBe(3)
    expect(releaseTarget(0, -0.5, -3, 4)).toBe(0)
  })
})

describe('dragOffset', () => {
  it('sigue al dedo entre escenas', () => {
    expect(dragOffset(1, 200, 800, 4)).toBe(0.25)
  })

  it('resiste más allá de la primera y la última', () => {
    expect(dragOffset(0, -200, 800, 4)).toBe(-0.25 * EDGE_RESISTANCE)
    expect(dragOffset(3, 200, 800, 4)).toBe(0.25 * EDGE_RESISTANCE)
  })

  it('nunca pasa de una escena', () => {
    expect(dragOffset(1, 5000, 800, 4)).toBe(1)
  })
})

describe('sceneFrame', () => {
  it('centra bajo la navbar lo que entra', () => {
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
