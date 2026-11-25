import { describe, expect, it } from 'vitest'
import { HOME_WARP, SHOWCASE_WARP, bandHeight, reflectFocus, reflectSpan, reflectWidth } from './edge-warp.js'

describe('bandHeight', () => {
  it('usa el alto del look, limitado a una fracción de la ventana', () => {
    expect(bandHeight(HOME_WARP, 900)).toBe(45)
    expect(bandHeight(HOME_WARP, 200)).toBeCloseTo(26)
    expect(bandHeight(SHOWCASE_WARP, 1000)).toBe(150)
    expect(bandHeight(SHOWCASE_WARP, 300)).toBeCloseTo(66)
  })

  it('en una columna, la franja es más baja', () => {
    expect(bandHeight(SHOWCASE_WARP, 812, true)).toBe(60)
  })

  it('el showcase tiene más protagonismo que la home', () => {
    expect(bandHeight(SHOWCASE_WARP, 900)).toBeGreaterThan(bandHeight(HOME_WARP, 900))
    expect(SHOWCASE_WARP.stretch).toBeGreaterThan(0)
  })
})

describe('reflectWidth', () => {
  it('la home no refleja; el showcase sí, a los costados', () => {
    expect(reflectWidth(HOME_WARP, 1280)).toBe(0)
    expect(reflectWidth(SHOWCASE_WARP, 3000)).toBe(86)
  })

  it('por debajo de 344 px de alto, la franja es una fracción de la ventana', () => {
    expect(reflectWidth(SHOWCASE_WARP, 800)).toBe(86)
    expect(reflectWidth(SHOWCASE_WARP, 300)).toBeCloseTo(75)
  })
})

describe('reflectSpan', () => {
  it('el reflejo va en el centro de cada costado, no en todo el borde', () => {
    expect(reflectSpan(HOME_WARP, 800)).toBe(0)
    expect(reflectSpan(SHOWCASE_WARP, 800)).toBeCloseTo(208)
    expect(reflectSpan(SHOWCASE_WARP, 800) * 2).toBeLessThan(800)
  })
})

describe('reflectFocus', () => {
  const h = 750

  it('entero con una card centrada en la ventana', () => {
    expect(reflectFocus([0, -786], h, SHOWCASE_WARP)).toBe(1)
    expect(reflectFocus([30, 816], h, SHOWCASE_WARP)).toBe(1)
  })

  it('se apaga a lo largo de reflectFade: con el espacio entre cards en el centro, casi nada', () => {
    expect(reflectFocus([420, -420], h, SHOWCASE_WARP)).toBe(0)
    expect(reflectFocus([393, -393], h, SHOWCASE_WARP)).toBeLessThan(0.05)
  })

  it('crece de forma continua y sin cards no hay reflejo', () => {
    const mid = reflectFocus([200], h, SHOWCASE_WARP)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    expect(reflectFocus([], h, SHOWCASE_WARP)).toBe(0)
  })
})
