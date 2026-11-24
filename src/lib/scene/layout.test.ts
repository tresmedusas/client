import { describe, expect, it } from 'vitest'
import { FOOTER_GAP, NAV_SPACE, SCENE_TOP, columnWidth, flow, footerBands, footerReserve, footerTop, grid, heroLayout, rows, stack } from './layout.js'

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
  const ASPECT = 490 / 524.85

  it('centra en la columna el logo arriba y el texto debajo, y el bloque en el alto libre', () => {
    for (const [vw, vh, compact] of [[1440, 900, false], [375, 812, true]] as const) {
      const width = columnWidth(vw)
      const block = 200
      const h = heroLayout(width, vh, compact, 'tresmedusas', ASPECT, block)
      // Centrados en la columna.
      expect(h.logo.x).toBeCloseTo(width / 2)
      expect(h.textWidth).toBeLessThanOrEqual(width)
      expect(h.logo.width / h.logo.height).toBeCloseTo(ASPECT)
      // El logo arriba del texto, sin tocarlo.
      expect(h.logo.y + h.logo.height / 2).toBeLessThan(h.textTop)
      // Todo el bloque centrado entre el margen de arriba y la navbar.
      const top = h.logo.y - h.logo.height / 2
      const bottom = h.textTop + block
      expect(top - SCENE_TOP).toBeCloseTo(vh - NAV_SPACE - bottom)
      expect(top).toBeGreaterThanOrEqual(SCENE_TOP)
    }
  })

  it('en escritorio el texto no pasa de una medida corta', () => {
    const h = heroLayout(columnWidth(1440), 900, false, 'tresmedusas', ASPECT)
    expect(h.textWidth).toBe(720)
  })

  it('el título entra en el ancho del texto', () => {
    for (const [vw, compact] of [[1440, false], [800, false], [375, true], [320, true]] as const) {
      const h = heroLayout(columnWidth(vw), 800, compact, 'tresmedusas', ASPECT)
      expect(h.titleSize * 0.56 * 'tresmedusas'.length).toBeLessThanOrEqual(h.textWidth + 0.001)
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
