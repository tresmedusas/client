import { describe, expect, it } from 'vitest'
import { FOOTER_GAP, MEDUSA_ASPECT, MEDUSA_COUNT, NAV_SPACE, SCENE_TOP, bob, columnWidth, flow, footerBands, footerReserve, footerTop, grid, heroLayout, rows, stack } from './layout.js'

describe('columnWidth', () => {
  it('deja 16 px de margen en un teléfono', () => {
    expect(columnWidth(375)).toBe(343)
  })

  it('no pasa del máximo en una pantalla ancha', () => {
    expect(columnWidth(1920)).toBe(1080)
  })
})

describe('stack', () => {
  it('apila con separación entre secciones, no después de la última', () => {
    expect(stack([100, 50, 30], 10)).toEqual({ tops: [0, 110, 170], total: 200 })
  })

  it('sin secciones mide 0', () => {
    expect(stack([], 10)).toEqual({ tops: [], total: 0 })
  })
})

describe('grid', () => {
  it('reparte el ancho entre columnas iguales', () => {
    const g = grid(1000, 2, 20)
    expect(g.cellWidth).toBe(490)
    expect(g.x(0)).toBe(245)
    expect(g.x(1)).toBe(755)
    expect(g.x(2)).toBe(245)
  })
})

describe('rows', () => {
  it('cada fila mide lo que su celda más alta', () => {
    expect(rows([100, 140, 90, 60], 2, 20)).toEqual({ tops: [0, 160], heights: [140, 90], total: 250 })
  })

  it('en una columna, una fila por celda', () => {
    expect(rows([100, 140], 1, 10).heights).toEqual([100, 140])
  })
})

describe('heroLayout', () => {
  it('pone el texto arriba y la campana debajo del botón, dentro de la ventana', () => {
    for (const [width, vh, compact] of [
      [1080, 900, false],
      [1080, 680, false],
      [343, 812, true],
      [288, 568, true],
    ] as const) {
      const { textTop, textBottom, medusas } = heroLayout(width, vh, compact, 'Tres Medusas.\nSoluciones a medida.')
      expect(medusas).toHaveLength(MEDUSA_COUNT)
      const m = medusas.at(-1)!
      expect(textTop).toBeGreaterThanOrEqual(SCENE_TOP)
      expect(m.x).toBe(0)
      expect(m.width / m.height).toBeCloseTo(MEDUSA_ASPECT)
      // Tope de la campana (8 % del dibujo), medido desde el tope de la ventana.
      const bellTop = vh / 2 - (m.y + m.height / 2) + m.height * 0.08
      expect(bellTop).toBeGreaterThan(textBottom)
      expect(bellTop).toBeLessThan(vh * 0.75)
      // Las acompañantes: más chicas, a los costados y también debajo del texto.
      for (const c of medusas.slice(0, -1)) {
        expect(c.height).toBeLessThan(m.height * 0.5)
        expect(c.width / c.height).toBeCloseTo(MEDUSA_ASPECT)
        expect(Math.abs(c.x)).toBeGreaterThan(width * 0.3)
        expect(vh / 2 - (c.y + c.height / 2) + c.height * 0.08).toBeGreaterThan(textBottom)
      }
    }
  })

  it('achica el título hasta que cada línea entra en el ancho', () => {
    const title = 'Tres Medusas.\nSoluciones a medida.'
    // En escritorio entra sin achicarse: el mismo tamaño que con una línea.
    expect(heroLayout(1080, 900, false, title).titleSize).toBe(heroLayout(1080, 900, false, 'Tres Medusas').titleSize)
    const { titleSize } = heroLayout(288, 568, true, title)
    expect(titleSize * 0.56 * 'Soluciones a medida.'.length).toBeLessThanOrEqual(288)
    // Dos líneas empujan la medusa más abajo que una.
    const one = heroLayout(1080, 900, false, 'Tres Medusas')
    const two = heroLayout(1080, 900, false, title)
    expect(two.textBottom).toBeGreaterThan(one.textBottom)
    expect(two.medusas.at(-1)!.y).toBeLessThan(one.medusas.at(-1)!.y)
  })
})

describe('bob', () => {
  it('se mueve a la vista pero sin irse más de un 4 % de su alto', () => {
    let min = Infinity
    let max = -Infinity
    for (let t = 0; t < 60; t += 0.05) {
      const { dx, dy } = bob(1000, t)
      expect(Math.abs(dy)).toBeLessThanOrEqual(32 + 1e-9)
      expect(Math.abs(dx)).toBeLessThanOrEqual(16 + 1e-9)
      min = Math.min(min, dy)
      max = Math.max(max, dy)
    }
    expect(max - min).toBeGreaterThan(40)
  })

  it('avanza sin saltos: en un cuadro (1/60 s) se mueve menos de un píxel', () => {
    for (let t = 0; t < 30; t += 0.05) {
      const a = bob(1000, t)
      const b = bob(1000, t + 1 / 60)
      expect(Math.abs(b.dy - a.dy)).toBeLessThan(1)
    }
  })
})

describe('flow', () => {
  it('pasa a la fila siguiente lo que no entra', () => {
    expect(flow([100, 100, 100], 250, 10)).toEqual({ x: [0, 110, 0], row: [0, 0, 1], rows: 2 })
  })

  it('una caja más ancha que la fila igual empieza en su fila', () => {
    expect(flow([300], 250, 10)).toEqual({ x: [0], row: [0], rows: 1 })
  })

  it('sin cajas no hay filas', () => {
    expect(flow([], 250, 10).rows).toBe(0)
  })

  it('centrado: cada fila queda al medio de la columna', () => {
    expect(flow([100, 100, 100], 250, 10, 'center')).toEqual({ x: [20, 130, 75], row: [0, 0, 1], rows: 2 })
  })
})

describe('footerTop', () => {
  const { top, bottom } = footerBands(false)

  it('con el contenido entero en la ventana, el pie queda sobre la navbar', () => {
    // Contenido de 200 px con el tope a 100 px del borde, en una ventana de 900.
    expect(footerTop(-200, 100, 900, false)).toBe(100 - 900 + NAV_SPACE + top + bottom)
  })

  it('si el contenido no entra, va FOOTER_GAP debajo de él', () => {
    expect(footerTop(-1200, 48, 700, false)).toBe(-1200 - FOOTER_GAP)
  })

  it('la reserva es el aire más las dos franjas: con el scroll interno al máximo, el pie termina sobre la navbar', () => {
    expect(footerReserve(true)).toBe(FOOTER_GAP + footerBands(true).top + footerBands(true).bottom)
  })
})
