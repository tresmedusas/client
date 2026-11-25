import { describe, expect, it } from 'vitest'
import { headlineParts, headlinePlain, headlineTokens } from './inline-headline.js'

describe('headlineParts', () => {
  it('destaca lo marcado con **', () => {
    expect(headlineParts('Primero, **el problema.** Después, la herramienta.')).toEqual([
      { text: 'Primero, ', accent: false },
      { text: 'el problema.', accent: true },
      { text: ' Después, la herramienta.', accent: false },
    ])
  })

  it('sin marcas, destaca el lead-in', () => {
    expect(headlineParts('Tres fundadores. Un equipo.')).toEqual([
      { text: 'Tres fundadores.', accent: true },
      { text: ' Un equipo.', accent: false },
    ])
  })

  it('sin marcas ni lead-in, destaca todo', () => {
    expect(headlineParts('Proyecto de ejemplo 1')).toEqual([{ text: 'Proyecto de ejemplo 1', accent: true }])
  })
})

describe('headlinePlain', () => {
  it('quita las marcas', () => {
    expect(headlinePlain('Cuéntanos **tu proceso.**')).toBe('Cuéntanos tu proceso.')
  })
})

describe('headlineTokens', () => {
  it('parte en palabras y junta los tramos pegados', () => {
    expect(headlineTokens('Lo que ya **construimos**. Uno')).toEqual([
      [{ text: 'Lo', accent: false }],
      [{ text: 'que', accent: false }],
      [{ text: 'ya', accent: false }],
      [
        { text: 'construimos', accent: true },
        { text: '.', accent: false },
      ],
      [{ text: 'Uno', accent: false }],
    ])
  })
})
