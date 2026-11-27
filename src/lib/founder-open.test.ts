import { describe, expect, it } from 'vitest'
import { cardClip, slitClip } from './founder-open.js'

describe('cardClip', () => {
  it('recorta la ventana a la card, con su radio', () => {
    expect(cardClip({ left: 100, top: 50, width: 300, height: 420 }, 1200, 800, 20)).toBe('inset(50px 800px 330px 100px round 20px)')
  })

  it('con la ventana entera no recorta', () => {
    expect(cardClip({ left: 0, top: 0, width: 1200, height: 800 }, 1200, 800, 0)).toBe('inset(0px 0px 0px 0px round 0px)')
  })
})

describe('slitClip', () => {
  it('cerrada es una línea de 2 px a la altura pedida', () => {
    expect(slitClip(0.66, false)).toBe('inset(calc(66% - 1px) 0% calc(34% - 1px) 0%)')
  })

  it('abierta no recorta', () => {
    expect(slitClip(0.66, true)).toBe('inset(0% 0% 0% 0%)')
  })
})
