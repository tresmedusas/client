import { describe, expect, it } from 'vitest'
import { HERO } from '$lib/content.js'
import { STEP, variant } from '../headline.js'
import { HERO_FIGURES, WIPE, figureAt } from './hero.js'

const H = HERO.headline

describe('figuras del hero', () => {
  it('hay una por cada «qué construimos»', () => {
    expect(HERO_FIGURES).toHaveLength(H.what.length)
  })

  it('un solo acento por figura', () => {
    for (const f of HERO_FIGURES) {
      const strong = f.shapes.filter((s) => 'strong' in s && s.strong)
      expect(strong.length).toBeGreaterThan(0)
      expect(strong.length).toBeLessThanOrEqual(2)
    }
  })
})

describe('figureAt', () => {
  it('quieta, muestra la figura de lo que dice el titular', () => {
    for (let k = 0; k < 6; k++) {
      const f = figureAt(H, k * STEP + WIPE + 0.1)
      expect(f).toEqual({ from: variant(H, k).what, to: variant(H, k).what, p: 1 })
    }
  })

  it('cruza solo cuando cambia «qué construimos», de la figura de antes a la nueva', () => {
    // Paso 1: cambia «qué»; paso 2: cambia «para quién».
    const mid = figureAt(H, STEP + WIPE / 2)
    expect(mid.from).toBe(variant(H, 0).what)
    expect(mid.to).toBe(variant(H, 1).what)
    expect(mid.p).toBeGreaterThan(0)
    expect(mid.p).toBeLessThan(1)
    expect(figureAt(H, 2 * STEP + WIPE / 2).p).toBe(1)
  })
})
