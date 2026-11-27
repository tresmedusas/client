import { describe, expect, it } from 'vitest'
import { frostAmount } from './contact-look.js'

describe('Contacto desempañado', () => {
  it('está empañado al entrar y nítido al llenar la pantalla', () => {
    expect(frostAmount(-1)).toBe(1)
    expect(frostAmount(-0.5)).toBeCloseTo(0.5)
    expect(frostAmount(0)).toBe(0)
  })

  it('no se empaña fuera del recorrido de entrada', () => {
    expect(frostAmount(-1.4)).toBe(1)
    expect(frostAmount(0.6)).toBe(0)
  })

  it('se aclara de a poco en los extremos', () => {
    expect(frostAmount(-0.9)).toBeGreaterThan(0.9)
    expect(frostAmount(-0.1)).toBeLessThan(0.1)
  })
})
