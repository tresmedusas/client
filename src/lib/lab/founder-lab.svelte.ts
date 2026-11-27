import { FOUNDER_OPEN, FOUNDER_OPENS, FOUNDER_STAGGER, type FounderOpen } from '$lib/founder-open.js'

/**
 * El estado del banco de pruebas del modal de los fundadores, compartido por
 * el panel y el modal. Solo existe en desarrollo: en el build, el modal usa
 * `FOUNDER_OPEN` tal cual. Se guarda en localStorage (solo lo que difiere de
 * fábrica).
 */
const STORAGE_KEY = 'tres-medusas:founder-lab'

interface Saved {
  kind?: string
  stagger?: boolean
  slow?: boolean
}

function load(): Saved {
  if (typeof localStorage === 'undefined') return {}
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved) ?? {}
  } catch {
    return {}
  }
}

class FounderLab {
  kind = $state<FounderOpen>(FOUNDER_OPEN)
  stagger = $state(FOUNDER_STAGGER)
  /** En cámara lenta (×0.2). */
  slow = $state(false)

  constructor() {
    const saved = load()
    this.kind = FOUNDER_OPENS.find((o) => o.kind === saved.kind)?.kind ?? FOUNDER_OPEN
    this.stagger = saved.stagger ?? FOUNDER_STAGGER
    this.slow = saved.slow ?? false
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const saved: Saved = {
      kind: this.kind !== FOUNDER_OPEN ? this.kind : undefined,
      stagger: this.stagger !== FOUNDER_STAGGER ? this.stagger : undefined,
      slow: this.slow || undefined,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const founderLab = import.meta.env.DEV ? new FounderLab() : null
