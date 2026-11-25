import { HOME_WARP, SHOWCASE_WARP, type WarpLook } from '$lib/scene/edge-warp.js'
import { mergeLook, type LookName } from './warp-lab.js'

/**
 * El estado del banco de pruebas, compartido por el panel y la escena. Solo
 * se usa en desarrollo (`import.meta.env.DEV`): en el build, la escena usa
 * los looks de `edge-warp.ts` tal cual. Se guarda en localStorage para que un
 * recargo o un HMR no pierdan lo ajustado.
 */
const STORAGE_KEY = 'tres-medusas:warp-lab'

export const DEFAULT_LOOKS: Record<LookName, WarpLook> = { home: HOME_WARP, showcase: SHOWCASE_WARP }

interface Saved {
  looks?: Partial<Record<LookName, unknown>>
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
  /** Previsualizaciones de colores en lugar de los casos: el reflejo toma el color del caso. */
  colorCases = $state(false)
  open = $state(true)

  constructor() {
    const saved = load()
    this.looks = {
      home: mergeLook(HOME_WARP, saved.looks?.home),
      showcase: mergeLook(SHOWCASE_WARP, saved.looks?.showcase),
    }
    this.colorCases = saved.colorCases ?? false
    this.open = saved.open ?? true
  }

  reset(name: LookName) {
    this.looks[name] = { ...DEFAULT_LOOKS[name] }
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const saved: Saved = { looks: $state.snapshot(this.looks), colorCases: this.colorCases, open: this.open }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const lab = import.meta.env.DEV ? new WarpLab() : null
