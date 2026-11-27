import { describe, expect, it } from 'vitest'
import { HOME_WARP, SHOWCASE_WARP } from './edge-warp.js'
import { CASE_TRANSITION, IDLE_VIEW, TRANSITION_DURATION, swallowBand, swallowLook, transitionView, type ScreenRect } from './case-transition.js'
import { CaseTransition } from './case-transition.svelte.js'
import { SHOWCASE } from '$lib/content.js'

const FROM: ScreenRect = { x: 0, y: -120, width: 990, height: 660 }
const TO: ScreenRect = { x: 0, y: 40, width: 990, height: 660 }

describe('transitionView', () => {
  it('la que se usa: la card se abre en su página', () => {
    expect(CASE_TRANSITION).toBe('open')
  })

  it('quieta, no se ve nada', () => {
    expect(transitionView('open', 'idle', 0, FROM, TO)).toEqual(IDLE_VIEW)
  })

  it('open: el velo tapa todo menos la card, que después viaja a su lugar', () => {
    const start = transitionView('open', 'out', 0, FROM, null)
    expect(start.veil).toBe(0)
    expect(start.card).toEqual(FROM)
    expect(transitionView('open', 'out', 1, FROM, null).veil).toBe(1)
    // Sin destino todavía, espera tapada.
    expect(transitionView('open', 'in', 0.5, FROM, null)).toMatchObject({ veil: 1, card: FROM })
    const end = transitionView('open', 'in', 1, FROM, TO)
    expect(end.veil).toBe(0)
    expect(end.card).toEqual(TO)
  })

  it('swallow: las franjas se cierran, el papel tapa al cambiar de página y se retiran', () => {
    expect(transitionView('swallow', 'out', 0, FROM, null)).toMatchObject({ veil: 0, swallow: 0, card: null })
    expect(transitionView('swallow', 'out', 1, FROM, null)).toMatchObject({ veil: 1, swallow: 1 })
    expect(transitionView('swallow', 'in', 0, null, null)).toMatchObject({ veil: 1, swallow: 1 })
    expect(transitionView('swallow', 'in', 1, null, null)).toMatchObject({ veil: 0, swallow: 0 })
  })
})

describe('swallowBand y swallowLook', () => {
  it('en 1, las franjas llegan al centro; en 0, las de siempre', () => {
    expect(swallowBand(133, 1280, 0)).toBe(133)
    expect(swallowBand(133, 1280, 1)).toBe(640)
    expect(swallowBand(45, 800, 0.5)).toBe(222.5)
  })

  it('sin tragar, el look tal cual; tragando, más estirado', () => {
    expect(swallowLook(HOME_WARP, 0)).toBe(HOME_WARP)
    expect(swallowLook(SHOWCASE_WARP, 1).stretch).toBe(0.95)
    expect(swallowLook(HOME_WARP, 0.5).stretch).toBeGreaterThan(0)
  })
})

describe('CaseTransition', () => {
  const project = SHOWCASE.projects[0]!
  const href = `/showcase/${project.id}`

  it('cambia de página al terminar la fase out y espera a que la página informe la card', () => {
    const t = new CaseTransition()
    let navigated = 0
    t.start('open', href, () => navigated++, { project, index: 0, from: FROM })
    t.advance(TRANSITION_DURATION.open.out)
    expect(navigated).toBe(1)
    // Sigue en `out` hasta que cambia la página, y no vuelve a navegar.
    t.advance(1)
    expect(navigated).toBe(1)
    t.arrive(href)
    expect(t.phase).toBe('in')
    t.advance(10)
    expect(t.t).toBe(0)
    t.anchor(TO, 'case')
    t.advance(TRANSITION_DURATION.open.in)
    expect(t.active).toBe(false)
  })

  it('la página del caso informa dónde está su previsualización, aunque no haya transición', () => {
    const t = new CaseTransition()
    t.anchor(TO, 'case')
    expect(t.placed).toEqual(TO)
    expect(t.to).toBeNull()
    t.anchor(FROM, 'showcase')
    expect(t.placed).toEqual(TO)
  })

  it('al volver con la card: sale de la previsualización y espera a que el showcase informe su card', () => {
    const t = new CaseTransition()
    let navigated = 0
    t.start('open', '/showcase', () => navigated++, { project, index: 0, from: TO })
    // La página del caso sigue informando mientras se va: no es el destino.
    t.anchor(TO, 'case')
    t.advance(TRANSITION_DURATION.open.out)
    expect(navigated).toBe(1)
    t.arrive('/showcase')
    expect(t.to).toBeNull()
    t.advance(10)
    expect(t.t).toBe(0)
    expect(transitionView(t.kind, t.phase, t.t, t.from, t.to)).toMatchObject({ veil: 1, card: TO })
    t.anchor(FROM, 'showcase')
    t.advance(TRANSITION_DURATION.open.in / 2)
    expect(t.t).toBeCloseTo(0.5)
    t.advance(TRANSITION_DURATION.open.in)
    expect(t.active).toBe(false)
  })

  it('al volver al showcase, sin card: no espera a nadie', () => {
    const t = new CaseTransition()
    let navigated = 0
    t.start('swallow', '/showcase', () => navigated++)
    expect(t.project).toBeNull()
    t.advance(TRANSITION_DURATION.swallow.out)
    expect(navigated).toBe(1)
    t.arrive('/showcase')
    t.advance(TRANSITION_DURATION.swallow.in)
    expect(t.active).toBe(false)
  })

  it('si la página que llega no es la del caso, se corta', () => {
    const t = new CaseTransition()
    t.start('swallow', href, () => {})
    t.advance(1)
    t.arrive('/')
    expect(t.active).toBe(false)
  })

  it('en cámara lenta tarda más', () => {
    const t = new CaseTransition()
    t.speed = 0.5
    t.start('swallow', href, () => {})
    t.advance(TRANSITION_DURATION.swallow.out)
    expect(t.t).toBeCloseTo(0.5)
  })
})
