import { describe, expect, it } from 'vitest'
import { ASPECT } from './figures/hero.js'
import { CTA_HEIGHT, FOOTER_GAP, NAV_SPACE, SCENE_BOTTOM, columnWidth, flow, footerBands, footerReserve, footerTop, grid, heroLayout, rows, stack } from './layout.js'

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
  const TITLE = 'Construimos la identidad\nque tu emprendimiento necesita.'

  it('la figura llega al borde de abajo de la ventana, tan ancha como la columna', () => {
    for (const [vw, vh, compact] of [[1440, 900, false], [1920, 1080, false], [375, 812, true]] as const) {
      const width = columnWidth(vw)
      const text = 150
      const h = heroLayout(width, vh, compact, TITLE, text)
      expect(h.textWidth).toBeLessThanOrEqual(width)
      expect(h.figureWidth).toBe(Math.min(1100, width))
      expect(h.figureHeight).toBeLessThanOrEqual(Math.floor(h.figureWidth / ASPECT))
      expect(h.figureGap).toBeGreaterThanOrEqual(28)
      expect(h.textTop + text + h.gap + CTA_HEIGHT + h.figureGap + h.figureHeight).toBeCloseTo(vh)
      expect(h.textTop).toBeGreaterThanOrEqual(NAV_SPACE)
    }
  })

  it('con poco alto recorta la figura por abajo, y si queda muy baja no la muestra', () => {
    const text = 150
    const short = heroLayout(columnWidth(1280), 560, false, TITLE, text)
    expect(short.figureHeight).toBeLessThan(Math.floor(short.figureWidth / ASPECT))
    expect(short.textTop).toBe(NAV_SPACE)
    const h = heroLayout(columnWidth(1440), 420, false, TITLE, text)
    expect(h.figureWidth).toBe(0)
    const bottom = h.textTop + text + h.gap + CTA_HEIGHT
    expect(h.textTop - NAV_SPACE).toBeCloseTo(420 - SCENE_BOTTOM - bottom)
  })

  it('en escritorio la línea más larga entra en el ancho', () => {
    const h = heroLayout(columnWidth(1440), 900, false, TITLE)
    expect(h.textWidth).toBe(960)
    expect('que tu emprendimiento necesita.'.length * 0.56 * h.titleSize).toBeLessThanOrEqual(h.textWidth + 0.01)
    expect(h.titleSize).toBeGreaterThanOrEqual(48)
  })

  it('en un teléfono las líneas se parten, pero la palabra más larga entra', () => {
    const width = columnWidth(375)
    const h = heroLayout(width, 812, true, TITLE)
    expect('emprendimiento'.length * 0.56 * h.titleSize).toBeLessThanOrEqual(width)
    expect(h.titleSize).toBeLessThanOrEqual(44)
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

  it('con el contenido entero en la ventana, el pie queda pegado abajo', () => {
    // Contenido de 200 px con el tope a 100 px del borde, en una ventana de 900.
    expect(footerTop(-200, 100, 900, false)).toBe(100 - 900 + SCENE_BOTTOM + top + bottom)
  })

  it('si el contenido no entra, va FOOTER_GAP debajo de él', () => {
    expect(footerTop(-1200, 48, 700, false)).toBe(-1200 - FOOTER_GAP)
  })

  it('la reserva es el aire más las dos franjas: con el scroll interno al máximo, el pie termina en el borde de abajo', () => {
    expect(footerReserve(true)).toBe(FOOTER_GAP + footerBands(true).top + footerBands(true).bottom)
  })
})
