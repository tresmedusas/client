import { PRISM_LOOK, type PrismLook } from '$lib/scene/prism-look.js'
import { mergeLook } from './prism-lab.js'

/**
 * El estado del banco de pruebas del botón del hero, compartido por el panel
 * y la escena. Solo existe en desarrollo (`import.meta.env.DEV`): en el build,
 * el botón usa `PRISM_LOOK` tal cual. Se guarda en localStorage para que un
 * recargo o un HMR no pierdan lo ajustado.
 */
const STORAGE_KEY = 'tres-medusas:prism-lab'

interface Saved {
  look?: unknown
  open?: boolean
  navigate?: boolean
  hover?: boolean
}

function load(): Saved {
  if (typeof localStorage === 'undefined') return {}
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved) ?? {}
  } catch {
    return {}
  }
}

class PrismLab {
  look = $state<PrismLook>({ ...PRISM_LOOK })
  open = $state(true)
  /** El click navega; si no, solo destella (para verlo una y otra vez). */
  navigate = $state(false)
  /** El botón se ve como con el puntero encima, sin tenerlo. */
  hover = $state(false)

  constructor() {
    const saved = load()
    this.look = mergeLook(PRISM_LOOK, saved.look)
    this.open = saved.open ?? true
    this.navigate = saved.navigate ?? false
    this.hover = saved.hover ?? false
  }

  reset() {
    this.look = { ...PRISM_LOOK }
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const saved: Saved = { look: $state.snapshot(this.look), open: this.open, navigate: this.navigate, hover: this.hover }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const prismLab = import.meta.env.DEV ? new PrismLab() : null
