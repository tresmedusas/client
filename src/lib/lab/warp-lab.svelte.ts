import { HOME_WARP, SHOWCASE_WARP, type WarpLook } from '$lib/scene/edge-warp.js'
import { CASE_LOOK, type CaseLook } from '$lib/scene/layout.js'
import { diffValues, mergeValues, type LookName } from './warp-lab.js'

/**
 * El estado del banco de pruebas, compartido por el panel y la escena. Solo
 * se usa en desarrollo (`import.meta.env.DEV`): en el build, la escena usa
 * los looks de `edge-warp.ts` tal cual. Se guarda en localStorage para que un
 * recargo o un HMR no pierdan lo ajustado: solo lo que difiere de fábrica,
 * así un cambio en los valores de fábrica llega a lo que no se tocó.
 */
const STORAGE_KEY = 'tres-medusas:warp-lab'

export const DEFAULT_LOOKS: Record<LookName, WarpLook> = { home: HOME_WARP, showcase: SHOWCASE_WARP }

interface Saved {
  looks?: Partial<Record<LookName, unknown>>
  /** El tamaño de las cards (antes `cases`, que guardaba todo: se descarta). */
  cards?: unknown
  colorCases?: boolean
  open?: boolean
}

function load(): Saved {
  if (typeof localStorage === 'undefined') return {}
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved) ?? {}
  } catch {
    return {}
  }
}

class WarpLab {
  looks = $state<Record<LookName, WarpLook>>({ home: { ...HOME_WARP }, showcase: { ...SHOWCASE_WARP } })
  /** El tamaño de las cards del showcase. */
  cases = $state<CaseLook>({ ...CASE_LOOK })
  /** Previsualizaciones de colores en lugar de los casos: el reflejo toma el color del caso. */
  colorCases = $state(false)
  open = $state(true)

  constructor() {
    const saved = load()
    this.looks = {
      home: mergeValues(HOME_WARP, saved.looks?.home),
      showcase: mergeValues(SHOWCASE_WARP, saved.looks?.showcase),
    }
    this.cases = mergeValues(CASE_LOOK, saved.cards)
    this.colorCases = saved.colorCases ?? false
    this.open = saved.open ?? true
  }

  reset(name: LookName) {
    this.looks[name] = { ...DEFAULT_LOOKS[name] }
  }

  resetCases() {
    this.cases = { ...CASE_LOOK }
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const looks = $state.snapshot(this.looks)
    const saved: Saved = {
      looks: { home: diffValues(HOME_WARP, looks.home), showcase: diffValues(SHOWCASE_WARP, looks.showcase) },
      cards: diffValues(CASE_LOOK, $state.snapshot(this.cases)),
      colorCases: this.colorCases,
      open: this.open,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const lab = import.meta.env.DEV ? new WarpLab() : null
