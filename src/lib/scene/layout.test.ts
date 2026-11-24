import { describe, expect, it } from 'vitest'
import { bob, columnWidth, flow, grid, medusas, rows, stack } from './layout.js'

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

describe('medusas', () => {
  it('son tres y quedan dentro de la columna', () => {
    for (const compact of [true, false]) {
      const list = medusas(800, 800, compact)
      expect(list).toHaveLength(3)
      for (const m of list) {
        expect(m.x - m.width / 2).toBeGreaterThanOrEqual(0)
        expect(m.x).toBeLessThanOrEqual(800)
      }
    }
  })
})

describe('bob', () => {
  it('flota menos que una décima de su alto', () => {
    const [m] = medusas(1000, 800, false)
    for (let t = 0; t < 20; t += 0.37) {
      const { dy } = bob(m!, t)
      expect(Math.abs(dy)).toBeLessThanOrEqual(m!.height * 0.08 + 1e-9)
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
