import { describe, expect, it } from 'vitest'
import { LEAD_IN_MAX, leadIn } from './lead-in.js'

describe('leadIn', () => {
  it('separa la primera oración', () => {
    expect(leadIn('Entendemos el problema. Antes de escribir código, lo mapeamos.')).toEqual({
      lead: 'Entendemos el problema.',
      rest: ' Antes de escribir código, lo mapeamos.',
    })
  })

  it('acepta ?, ! y :', () => {
    expect(leadIn('¿Muchas planillas? Las juntamos en un sistema.').lead).toBe('¿Muchas planillas?')
    expect(leadIn('Sin vueltas: una llamada y empezamos.').lead).toBe('Sin vueltas:')
  })

  it('conserva el texto completo', () => {
    const text = 'Rápido. Y bien hecho.'
    const { lead, rest } = leadIn(text)
    expect(lead + rest).toBe(text)
  })

  it('no resalta un párrafo de una sola oración', () => {
    expect(leadIn('Software a medida e integraciones.')).toEqual({ lead: '', rest: 'Software a medida e integraciones.' })
  })

  it('no resalta una primera oración larga', () => {
    const text = `${'palabra '.repeat(LEAD_IN_MAX / 8 + 1).trim()}. Resto.`
    expect(leadIn(text).lead).toBe('')
  })

  it('ignora puntos sin espacio después, como en 2.5 o una URL', () => {
    expect(leadIn('Versión 2.5 lista. Sigue.').lead).toBe('Versión 2.5 lista.')
  })
})
