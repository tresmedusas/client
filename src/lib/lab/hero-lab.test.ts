import { describe, expect, it } from 'vitest'
import { LOOK } from '$lib/scene/figures/hero.js'
import { HEADLINE_TIMING } from '$lib/scene/headline.js'
import { HERO_LOOK } from '$lib/scene/hero-look.js'
import { FIGURE_CONTROLS, HERO_CONTROLS, TIMING_CONTROLS, formatFigureLook, formatHero } from './hero-lab.js'
import type { ControlGroup } from './warp-lab.js'

const SETS: readonly [readonly ControlGroup[], object][] = [
  [HERO_CONTROLS, HERO_LOOK],
  [TIMING_CONTROLS, HEADLINE_TIMING],
  [FIGURE_CONTROLS, LOOK],
]

describe('controles del hero', () => {
  it('cubren cada valor de los looks, una vez', () => {
    for (const [groups, values] of SETS) {
      const keys = groups.flatMap((g) => g.controls.map((c) => c.key))
      expect([...keys].sort()).toEqual(Object.keys(values).sort())
    }
  })

  it('los valores de fábrica entran en el rango de su control', () => {
    for (const [groups, values] of SETS) {
      for (const control of groups.flatMap((g) => g.controls)) {
        const value = (values as Record<string, number>)[control.key]
        expect(value).toBeGreaterThanOrEqual(control.min)
        expect(value).toBeLessThanOrEqual(control.max)
      }
    }
  })
})

describe('formatHero', () => {
  it('arma un bloque por archivo, con el nombre de su constante', () => {
    const blocks = formatHero(HERO_LOOK, HEADLINE_TIMING, LOOK)
    expect(blocks.map((b) => b.file)).toEqual(['hero-look.ts', 'headline.ts', 'figures/hero.ts'])
    expect(blocks[0]?.code).toContain('export const HERO_LOOK: HeroLook = {')
    expect(blocks[0]?.code).toContain('  sizeMax: 80,')
    expect(blocks[1]?.code).toContain('  hold: 2.4,')
  })

  it('la figura va sin tipo y con `as const`, redondeada al paso', () => {
    const code = formatFigureLook({ ...LOOK, scale: 1.5234 })
    expect(code.startsWith('export const LOOK = {')).toBe(true)
    expect(code).toContain('  scale: 1.52,')
    expect(code.trimEnd().endsWith('} as const;')).toBe(true)
  })
})
