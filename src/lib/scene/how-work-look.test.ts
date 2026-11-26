import { describe, expect, it } from 'vitest'
import { sheetState, sheetTrack } from './how-work-look.js'

describe('sheetState', () => {
  const S = 800
  const H = 200

  it('arranca con la primera hoja arriba y nada subiendo', () => {
    expect(sheetState(0, 4, S, H)).toEqual({ base: 0, rise: 0 })
  })

  it('durante la pausa la hoja queda quieta', () => {
    expect(sheetState(H - 1, 4, S, H)).toEqual({ base: 0, rise: 0 })
  })

  it('después de la pausa la siguiente sube 1:1 con el scroll', () => {
    expect(sheetState(H + S / 2, 4, S, H)).toEqual({ base: 0, rise: 0.5 })
  })

  it('al terminar de subir, la siguiente pasa a ser la de arriba', () => {
    expect(sheetState(S + H, 4, S, H)).toEqual({ base: 1, rise: 0 })
    expect(sheetState(S + H * 2 + S / 4, 4, S, H)).toEqual({ base: 1, rise: 0.25 })
  })

  it('al final queda la última, sin nada subiendo', () => {
    const end = sheetTrack(4, S, H)
    expect(sheetState(end, 4, S, H)).toEqual({ base: 3, rise: 0 })
    expect(sheetState(end + 500, 4, S, H)).toEqual({ base: 3, rise: 0 })
  })

  it('sin pausa, las hojas suben una tras otra', () => {
    expect(sheetState(S * 1.5, 4, S, 0)).toEqual({ base: 1, rise: 0.5 })
  })

  it('una sola hoja no tiene recorrido', () => {
    expect(sheetTrack(1, S, H)).toBe(0)
    expect(sheetState(300, 1, S, H)).toEqual({ base: 0, rise: 0 })
  })
})

describe('sheetTrack', () => {
  it('suma una pausa y una subida por hoja que sigue, y la pausa de la última', () => {
    expect(sheetTrack(4, 800, 200)).toBe(3 * 1000 + 200)
  })
})
