import { describe, expect, it } from 'vitest'
import { BEAM_KEYS, BEAM_UNIFORMS, FIELD_UNIFORMS, beamCount, beamsOf } from './beam-look.js'
import { PRISM_LOOK, SHADER_UNIFORMS } from './prism-look.js'

describe('haces compartidos', () => {
  it('el botón usa los uniforms de los haces reutilizables', () => {
    for (const [key, name] of Object.entries(BEAM_UNIFORMS)) expect(SHADER_UNIFORMS[key as keyof typeof SHADER_UNIFORMS]).toBe(name)
  })

  it('el campo de luz no pisa los uniforms de los haces', () => {
    const beams = new Set<string>(Object.values(BEAM_UNIFORMS))
    for (const name of Object.values(FIELD_UNIFORMS)) expect(beams.has(name), name).toBe(false)
  })

  it('separa los haces de un look y los cuenta enteros', () => {
    expect(Object.keys(beamsOf(PRISM_LOOK))).toEqual([...BEAM_KEYS])
    expect(beamCount({ ...PRISM_LOOK, beams: 2.6 })).toBe(3)
    expect(beamCount({ ...PRISM_LOOK, beams: 9 })).toBe(4)
    expect(beamCount({ ...PRISM_LOOK, beams: 0 })).toBe(1)
  })
})
