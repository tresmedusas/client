import { describe, expect, it } from 'vitest'
import { FAR, cameraX, depthScale, fade, galleryView, hallEdges, hallFog, place, portals, wallOf, wallX } from './gallery.js'

const view = galleryView(1440, 900, false, 40, 88)

describe('galleryView', () => {
  it('pone el punto de fuga en el medio del área sobre la navbar', () => {
    expect(view.vanishY).toBe(24)
  })
})

describe('wallOf / wallX', () => {
  it('cuelga los proyectos en paredes alternas, y la entrada y el cierre al centro', () => {
    expect([0, 1, 2, 3, 4].map((k) => wallOf(k, 5))).toEqual([0, 1, -1, 1, 0])
  })

  it('la entrada y el cierre quedan en el eje del pasillo', () => {
    expect(wallX(0, 5, view)).toBe(0)
    expect(wallX(4, 5, view)).toBe(0)
    expect(wallX(1, 5, view)).toBe(view.lateral)
  })
})

describe('cameraX', () => {
  it('en reposo, la cámara está frente a la pared de su escena', () => {
    expect(cameraX(0, 5, view)).toBe(0)
    expect(cameraX(2, 5, view)).toBe(-view.lateral)
    expect(cameraX(4, 5, view)).toBe(0)
  })

  it('entre dos escenas gira a mitad de camino', () => {
    expect(cameraX(1.5, 5, view)).toBeCloseTo(0)
  })
})

describe('depthScale', () => {
  it('es 1 enfrente, menos adelante y más mientras pasa de largo', () => {
    expect(depthScale(0, view)).toBe(1)
    expect(depthScale(-1, view)!).toBeLessThan(1)
    expect(depthScale(0.3, view)!).toBeGreaterThan(1)
  })

  it('no dibuja lo que quedó detrás de la cámara ni lo demasiado lejano', () => {
    expect(depthScale(0.7, view)).toBeNull()
    expect(depthScale(-(FAR + 0.1), view)).toBeNull()
  })
})

describe('place', () => {
  it('en reposo deja la escena donde está', () => {
    const at = place(0, 300, 300, view)!
    expect(at.x).toBeCloseTo(0)
    expect(at.y).toBeCloseTo(0)
    expect(at.scale).toBe(1)
  })

  it('lo lejano se junta hacia el punto de fuga', () => {
    const far = place(-2, 0, 0, view)!
    expect(far.x).toBe(0)
    // El origen de la escena (el centro de la ventana) se acerca al punto de fuga.
    expect(far.y).toBeGreaterThan(0)
    expect(far.y).toBeLessThan(view.vanishY)
  })
})

describe('fade', () => {
  it('enfrente se ve entero', () => {
    expect(fade(0)).toEqual({ text: 1, art: 1 })
  })

  it('la escena que pasa de largo desaparece antes de llenar la ventana', () => {
    expect(fade(0.5)).toEqual({ text: 0, art: 0 })
  })

  it('de lejos no se ve: la obra quedaría detrás del texto centrado', () => {
    expect(fade(-1)).toEqual({ text: 0, art: 0 })
  })

  it('la obra aparece antes que el texto mientras la cámara se acerca', () => {
    const near = fade(-0.5)
    expect(near.art).toBeGreaterThan(near.text)
  })
})

describe('hallFog', () => {
  it('las líneas del pasillo sí se ven a lo lejos, con niebla', () => {
    expect(hallFog(-1)).toBeGreaterThan(0.5)
    expect(hallFog(-2)).toBeLessThan(hallFog(-1))
    expect(hallFog(-FAR)).toBe(0)
  })
})

describe('portals / hallEdges', () => {
  it('hay un marco entre cada par de escenas, y en los dos extremos', () => {
    expect(portals(3)).toEqual([-0.5, 0.5, 1.5, 2.5])
  })

  it('las aristas van hacia el punto de fuga', () => {
    const [edge] = hallEdges(-0.5, -1.5, 0, view)
    // Más lejos, más cerca del punto de fuga.
    expect(Math.abs(edge!.x2)).toBeLessThan(Math.abs(edge!.x1))
    expect(Math.abs(edge!.y2 - view.vanishY)).toBeLessThan(Math.abs(edge!.y1 - view.vanishY))
  })

  it('sin aristas si un extremo quedó detrás de la cámara', () => {
    expect(hallEdges(0.8, -0.5, 0, view)).toEqual([])
  })
})
