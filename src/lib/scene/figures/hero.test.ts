import { describe, expect, it } from 'vitest'
import { HERO } from '$lib/content.js'
import { STEP, variant } from '../headline.js'
import { HERO_FIGURES, LOOK, WIPE, boundsOf, figureAt, liftOf, obliqueOffset, stack, sweep, type Shape } from './hero.js'

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

describe('stack', () => {
  const rect = (x: number, y: number, w: number, h: number, extra: Partial<Shape> = {}) =>
    ({ kind: 'rect', x, y, w, h, r: 2, ...extra }) as Shape

  it('todo apoya sobre la placa', () => {
    for (const f of HERO_FIGURES) {
      const levels = stack(f.shapes, LOOK)
      const plate = levels[0]!
      expect(f.shapes[0]).toMatchObject({ plate: true })
      expect(plate.lift).toBe(LOOK.plateDepth)
      for (const l of levels.slice(1)) expect(l.base).toBeGreaterThanOrEqual(plate.base + plate.lift)
    }
  })

  it('los renglones y los trazos sueltos no tienen volumen; las cards y el acento, sí', () => {
    const bar = rect(0, 0, 40, 4, { fill: 0.09, bare: true })
    const card = rect(0, 0, 60, 30, { fill: 0 })
    const ring = rect(0, 0, 60, 30, { strong: true })
    expect(liftOf(bar, LOOK)).toBe(0)
    expect(liftOf({ kind: 'line', points: [[0, 0], [10, 0]] }, LOOK)).toBe(0)
    expect(liftOf(card, LOOK)).toBe(LOOK.depth)
    expect(liftOf(ring, LOOK)).toBe(LOOK.accentDepth)
  })

  it('un volumen no pasa del 40 % de su lado más corto', () => {
    expect(liftOf(rect(0, 0, 6, 6, { fill: 0 }), LOOK)).toBeCloseTo(2.4)
  })

  it('lo que va después apoya sobre el volumen que pisa', () => {
    const [card, bar] = stack([rect(0, 0, 60, 30, { fill: 0 }), rect(0, 0, 40, 4, { fill: 0.09, bare: true })], LOOK)
    expect(bar!.base).toBeGreaterThan(card!.base + card!.lift)
  })

  it('el anillo del acento sube lo que encierra, aunque se dibuje antes', () => {
    const shapes = [rect(0, 0, 40, 4, { fill: 0.09, bare: true }), rect(0, 0, 60, 14, { strong: true })]
    const [bar, ring] = stack(shapes, LOOK)
    expect(bar!.base).toBeGreaterThan(ring!.base + ring!.lift)
  })

  it('en cada figura, el acento queda más alto que todo lo que no lo pisa', () => {
    for (const f of HERO_FIGURES) {
      const levels = stack(f.shapes, LOOK)
      const top = (i: number) => levels[i]!.base + levels[i]!.lift
      const accents = f.shapes.flatMap((s, i) => (s.strong ? [i] : []))
      const accentTop = Math.max(...accents.map(top))
      const clear = (i: number) =>
        accents.every((j) => {
          const a = boundsOf(f.shapes[j]!)
          const b = boundsOf(f.shapes[i]!)
          return a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0
        })
      for (let i = 0; i < f.shapes.length; i++) if (clear(i)) expect(top(i)).toBeLessThan(accentTop)
    }
  })
})

describe('obliqueOffset', () => {
  it('la cara de arriba de la placa no se corre', () => {
    const [x, y] = obliqueOffset(LOOK.plateDepth, LOOK)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('lo más alto se corre hacia arriba a la izquierda, `obliqueRatio` por px', () => {
    const [x, y] = obliqueOffset(LOOK.plateDepth + 10, { ...LOOK, obliqueAngle: 45, obliqueRatio: 0.5 })
    expect(x).toBeCloseTo(-5 * Math.SQRT1_2)
    expect(y).toBeCloseTo(-5 * Math.SQRT1_2)
  })
})

describe('sweep', () => {
  it('envuelve el contorno y su copia corrida', () => {
    const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]]
    const hull = sweep(square, [-3, -3])
    expect(hull).toHaveLength(6)
    for (const p of [[-3, -3], [7, -3], [10, 0], [10, 10], [0, 10], [-3, 7]]) expect(hull).toContainEqual(p)
  })
})
