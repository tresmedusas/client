import { describe, expect, it } from 'vitest'
import logo from '../../../static/brand/medusa-s.svg?raw'
import { morphAt, morphPath, parseMorphSvg, tokenize } from './morph-path.js'

describe('tokenize', () => {
  it('separa comandos y números, con signos y decimales pegados', () => {
    const { template, numbers } = tokenize('M1.5-2C.5.5 3e1 4L-1 0Z')
    expect(template).toEqual(['M', null, null, 'C', null, null, null, null, 'L', null, null, 'Z'])
    expect(numbers).toEqual([1.5, -2, 0.5, 0.5, 30, 4, -1, 0])
  })
})

describe('morphAt', () => {
  const path = morphPath(['M0 0L10 0', 'M0 10L20 0', 'M0 0L10 0'])

  it('en los extremos da el primer y el último cuadro', () => {
    expect(morphAt(path, 0)).toBe('M0.00 0.00 L10.00 0.00 ')
    expect(morphAt(path, 1)).toBe('M0.00 0.00 L10.00 0.00 ')
  })

  it('interpola lineal entre cuadros', () => {
    expect(morphAt(path, 0.25)).toBe('M0.00 5.00 L15.00 0.00 ')
    expect(morphAt(path, 0.5)).toBe('M0.00 10.00 L20.00 0.00 ')
  })

  it('no acepta cuadros con otros comandos', () => {
    expect(() => morphPath(['M0 0L1 1', 'M0 0C1 1 2 2 3 3'])).toThrow()
  })
})

describe('parseMorphSvg', () => {
  it('lee el logo del hero: tres trazos animados en un ciclo de 3.6 s', () => {
    const svg = parseMorphSvg(logo)
    expect(svg.viewBox).toEqual([-20, -40, 490, 524.85])
    expect(svg.duration).toBe(3.6)
    expect(svg.paths).toHaveLength(3)
    for (const path of svg.paths) expect(path.frames.length).toBeGreaterThan(1)
  })
})
