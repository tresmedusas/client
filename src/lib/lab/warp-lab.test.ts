import { describe, expect, it } from 'vitest'
import { HOME_WARP, SHOWCASE_WARP, type WarpLook } from '$lib/scene/edge-warp.js'
import { CASE_LOOK } from '$lib/scene/layout.js'
import { CASE_CONTROLS, CONTROL_GROUPS, type ControlGroup, changedKeys, decimals, diffValues, formatConst, mergeValues, rounded, testPreview } from './warp-lab.js'

describe('controles', () => {
  const keysOf = (groups: readonly ControlGroup[]) => groups.flatMap((g) => g.controls.map((c) => c.key as string))

  it('cubren cada valor de los looks, una vez', () => {
    expect([...keysOf(CONTROL_GROUPS)].sort()).toEqual(Object.keys(SHOWCASE_WARP).sort())
    expect([...keysOf(CASE_CONTROLS)].sort()).toEqual(Object.keys(CASE_LOOK).sort())
  })

  it('los valores de fábrica entran en el rango de su control', () => {
    const check = (groups: readonly ControlGroup[], values: Record<string, number>) => {
      for (const control of groups.flatMap((g) => g.controls)) {
        expect(values[control.key]).toBeGreaterThanOrEqual(control.min)
        expect(values[control.key]).toBeLessThanOrEqual(control.max)
      }
    }
    check(CONTROL_GROUPS, HOME_WARP as unknown as Record<string, number>)
    check(CONTROL_GROUPS, SHOWCASE_WARP as unknown as Record<string, number>)
    check(CASE_CONTROLS, CASE_LOOK as unknown as Record<string, number>)
  })
})

describe('decimals y rounded', () => {
  it('redondea al paso del control de su grupo', () => {
    expect(decimals(1)).toBe(0)
    expect(decimals(0.005)).toBe(3)
    expect(rounded(CONTROL_GROUPS, 'stretch', 0.8234)).toBe(0.82)
    expect(rounded(CONTROL_GROUPS, 'height', 180.4)).toBe(180)
    expect(rounded(CASE_CONTROLS, 'aspect', 1.6049)).toBe(1.6)
  })
})

describe('mergeValues', () => {
  it('toma solo números de claves conocidas', () => {
    const look = mergeValues(SHOWCASE_WARP, { height: 240, blur: 'x', nada: 3, ripple: Number.NaN })
    expect(look.height).toBe(240)
    expect(look.blur).toBe(SHOWCASE_WARP.blur)
    expect(look.ripple).toBe(SHOWCASE_WARP.ripple)
    expect('nada' in look).toBe(false)
  })

  it('sin nada guardado, los de fábrica', () => {
    expect(mergeValues(HOME_WARP, null)).toEqual(HOME_WARP)
    expect(mergeValues(CASE_LOOK, undefined)).toEqual(CASE_LOOK)
  })
})

describe('diffValues', () => {
  it('solo lo que difiere de fábrica', () => {
    expect(diffValues(CASE_LOOK, { ...CASE_LOOK, gap: 60 })).toEqual({ gap: 60 })
    expect(diffValues(SHOWCASE_WARP, SHOWCASE_WARP)).toEqual({})
  })
})

describe('formatConst y changedKeys', () => {
  it('escribe los valores como código', () => {
    const code = formatConst('SHOWCASE_WARP', 'WarpLook', { ...SHOWCASE_WARP, stretch: 0.7012 }, CONTROL_GROUPS)
    expect(code.startsWith('export const SHOWCASE_WARP: WarpLook = {\n')).toBe(true)
    expect(code).toContain('  stretch: 0.7,\n')
    expect(code).toContain(`  height: ${SHOWCASE_WARP.height},\n`)
    expect(formatConst('CASE_LOOK', 'CaseLook', CASE_LOOK, CASE_CONTROLS)).toContain(`  aspect: ${CASE_LOOK.aspect},\n`)
  })

  it('lista solo lo que cambió', () => {
    const look: WarpLook = { ...SHOWCASE_WARP, blur: SHOWCASE_WARP.blur + 5, stretch: SHOWCASE_WARP.stretch + 0.0001 }
    expect(changedKeys(SHOWCASE_WARP, look, CONTROL_GROUPS)).toEqual(['blur'])
    expect(changedKeys(CASE_LOOK, { ...CASE_LOOK, gap: 60 }, CASE_CONTROLS)).toEqual(['gap'])
  })
})

describe('testPreview', () => {
  it('una imagen de colores distinta por caso', () => {
    expect(testPreview(0).startsWith('data:image/svg+xml')).toBe(true)
    expect(testPreview(0)).not.toBe(testPreview(1))
  })
})
