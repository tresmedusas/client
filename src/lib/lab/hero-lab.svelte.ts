import { LOOK, type FigureLook } from '$lib/scene/figures/hero.js'
import { HEADLINE_TIMING, type HeadlineTiming } from '$lib/scene/headline.js'
import { HERO_LOOK, type HeroLook } from '$lib/scene/hero-look.js'
import { diffValues, mergeValues } from './warp-lab.js'

/**
 * El estado del banco de pruebas del hero de la home, compartido por el panel
 * y la escena. Solo existe en desarrollo: en el build, el hero usa
 * `HERO_LOOK`, `HEADLINE_TIMING` y `LOOK` tal cual. Se guarda en localStorage
 * (solo lo que difiere de fábrica).
 */
const STORAGE_KEY = 'tres-medusas:hero-lab'

/** El look de la figura, de fábrica, como números (en su archivo es `as const`). */
export const FIGURE_LOOK: FigureLook = LOOK

interface Saved {
  look?: unknown
  timing?: unknown
  figure?: unknown
  paused?: boolean
}

function load(): Saved {
  if (typeof localStorage === 'undefined') return {}
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved) ?? {}
  } catch {
    return {}
  }
}

class HeroLab {
  look = $state<HeroLook>({ ...HERO_LOOK })
  timing = $state<HeadlineTiming>({ ...HEADLINE_TIMING })
  figure = $state<FigureLook>({ ...FIGURE_LOOK })
  /** La rotación del titular y de la figura está frenada, para mirar una combinación. */
  paused = $state(false)
  /** Cuántas veces se pidió «Siguiente combinación»: el hero adelanta su reloj un paso por cada una. No se guarda. */
  skips = $state(0)

  constructor() {
    const saved = load()
    this.look = mergeValues(HERO_LOOK, saved.look)
    this.timing = mergeValues(HEADLINE_TIMING, saved.timing)
    this.figure = mergeValues(FIGURE_LOOK, saved.figure)
    this.paused = saved.paused ?? false
  }

  reset() {
    this.look = { ...HERO_LOOK }
    this.timing = { ...HEADLINE_TIMING }
    this.figure = { ...FIGURE_LOOK }
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const saved: Saved = {
      look: diffValues(HERO_LOOK, $state.snapshot(this.look)),
      timing: diffValues(HEADLINE_TIMING, $state.snapshot(this.timing)),
      figure: diffValues(FIGURE_LOOK, $state.snapshot(this.figure)),
      paused: this.paused,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const heroLab = import.meta.env.DEV ? new HeroLab() : null
