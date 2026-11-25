import { describe, expect, it } from 'vitest'
import { HOME_WARP, SHOWCASE_WARP, type WarpLook } from '$lib/scene/edge-warp.js'
import { CONTROL_GROUPS, changedKeys, decimals, formatLook, mergeLook, rounded, testPreview } from './warp-lab.js'

describe('CONTROL_GROUPS', () => {
  const keys = CONTROL_GROUPS.flatMap((g) => g.controls.map((c) => c.key))

  it('cubre cada valor del look, una vez', () => {
    expect([...keys].sort()).toEqual(Object.keys(SHOWCASE_WARP).sort())
  })

  it('los valores de fábrica entran en el rango de su control', () => {
    for (const control of CONTROL_GROUPS.flatMap((g) => g.controls)) {
      for (const look of [HOME_WARP, SHOWCASE_WARP]) {
        expect(look[control.key]).toBeGreaterThanOrEqual(control.min)
        expect(look[control.key]).toBeLessThanOrEqual(control.max)
      }
    }
  })
})

describe('decimals y rounded', () => {
  it('redondea al paso del control', () => {
    expect(decimals(1)).toBe(0)
    expect(decimals(0.005)).toBe(3)
    expect(rounded('stretch', 0.8234)).toBe(0.82)
    expect(rounded('height', 180.4)).toBe(180)
  })
})

describe('mergeLook', () => {
  it('toma solo números de claves conocidas', () => {
    const look = mergeLook(SHOWCASE_WARP, { height: 240, blur: 'x', nada: 3, ripple: Number.NaN })
    expect(look.height).toBe(240)
    expect(look.blur).toBe(SHOWCASE_WARP.blur)
    expect(look.ripple).toBe(SHOWCASE_WARP.ripple)
    expect('nada' in look).toBe(false)
  })

  it('sin nada guardado, los de fábrica', () => {
    expect(mergeLook(HOME_WARP, null)).toEqual(HOME_WARP)
  })
})

describe('formatLook y changedKeys', () => {
  it('escribe el look como código de edge-warp.ts', () => {
    const code = formatLook('showcase', { ...SHOWCASE_WARP, stretch: 0.7012 })
    expect(code.startsWith('export const SHOWCASE_WARP: WarpLook = {\n')).toBe(true)
    expect(code).toContain('  stretch: 0.7,\n')
    expect(code).toContain(`  height: ${SHOWCASE_WARP.height},\n`)
  })

  it('lista solo lo que cambió', () => {
    const look: WarpLook = { ...SHOWCASE_WARP, blur: 40, stretch: 0.8201 }
    expect(changedKeys(SHOWCASE_WARP, look)).toEqual(['blur'])
  })
})

describe('testPreview', () => {
  it('una imagen de colores distinta por caso', () => {
    expect(testPreview(0).startsWith('data:image/svg+xml')).toBe(true)
    expect(testPreview(0)).not.toBe(testPreview(1))
  })
})
