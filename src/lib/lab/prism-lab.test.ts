import { describe, expect, it } from 'vitest'
import { PRISM_LOOK, SHADER_UNIFORMS, hueRanges } from '$lib/scene/prism-look.js'
import { CONTROL_GROUPS, changedKeys, decimals, formatLook, mergeLook, rounded } from './prism-lab.js'

describe('banco de pruebas del botón', () => {
  it('tiene un control para cada valor del look, y uno solo', () => {
    const keys = CONTROL_GROUPS.flatMap((g) => g.controls.map((c) => c.key))
    expect(new Set(keys).size).toBe(keys.length)
    expect([...keys].sort()).toEqual(Object.keys(PRISM_LOOK).sort())
  })

  it('los valores de fábrica entran en el rango de su control', () => {
    for (const control of CONTROL_GROUPS.flatMap((g) => g.controls)) {
      const value = PRISM_LOOK[control.key]
      expect(value, control.key).toBeGreaterThanOrEqual(control.min)
      expect(value, control.key).toBeLessThanOrEqual(control.max)
    }
  })

  it('los uniforms del shader son claves del look', () => {
    for (const key of Object.keys(SHADER_UNIFORMS)) expect(PRISM_LOOK).toHaveProperty(key)
  })

  it('arma el rango de color de cada haz', () => {
    expect(hueRanges(PRISM_LOOK).slice(0, 2)).toEqual([
      [46, 36],
      [287, 227],
    ])
  })

  it('mezcla lo guardado sobre los valores de fábrica, solo con números', () => {
    const look = mergeLook(PRISM_LOOK, { ring: 7, gain: 'mucho', otra: 3, flash: Number.NaN })
    expect(look.ring).toBe(7)
    expect(look.gain).toBe(PRISM_LOOK.gain)
    expect(look.flash).toBe(PRISM_LOOK.flash)
    expect(look).not.toHaveProperty('otra')
    expect(mergeLook(PRISM_LOOK, null)).toEqual(PRISM_LOOK)
  })

  it('redondea al paso del control y cuenta los cambios', () => {
    expect(decimals(0.005)).toBe(3)
    expect(rounded('lensAb', 0.12345)).toBe(0.123)
    expect(changedKeys(PRISM_LOOK, { ...PRISM_LOOK, ring: PRISM_LOOK.ring + 1, gain: PRISM_LOOK.gain + 0.001 })).toEqual(['ring'])
  })

  it('copia el look como código para prism-look.ts', () => {
    const code = formatLook({ ...PRISM_LOOK, ring: 6 })
    expect(code.startsWith('export const PRISM_LOOK: PrismLook = {\n')).toBe(true)
    expect(code).toContain('  ring: 6,\n')
    expect(code).toContain('  beams: 2,\n')
  })
})
