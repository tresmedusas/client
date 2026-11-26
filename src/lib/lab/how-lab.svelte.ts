import {
  FIGURE_PLATES,
  HOW_LOOK,
  HOW_PLATE,
  HOW_SHEETS,
  HOW_SOLID,
  SHEET_MODES,
  type FigurePlate,
  type HowWorkLook,
  type SheetMode,
} from '$lib/scene/how-work-look.js'
import { diffValues, mergeValues } from './warp-lab.js'

/**
 * El estado del banco de pruebas de «Cómo trabajamos», compartido por el panel
 * y la escena. Solo existe en desarrollo: en el build, la escena usa los
 * valores de `how-work-look.ts` tal cual. Se guarda en localStorage (solo lo
 * que difiere de fábrica).
 */
const STORAGE_KEY = 'tres-medusas:how-lab'

interface Saved {
  look?: unknown
  sheets?: string
  plate?: string
  solid?: boolean
}

function load(): Saved {
  if (typeof localStorage === 'undefined') return {}
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved) ?? {}
  } catch {
    return {}
  }
}

class HowLab {
  look = $state<HowWorkLook>({ ...HOW_LOOK })
  sheets = $state<SheetMode>(HOW_SHEETS)
  plate = $state<FigurePlate>(HOW_PLATE)
  solid = $state(HOW_SOLID)

  constructor() {
    const saved = load()
    this.look = mergeValues(HOW_LOOK, saved.look)
    this.sheets = SHEET_MODES.find((m) => m.mode === saved.sheets)?.mode ?? HOW_SHEETS
    this.plate = FIGURE_PLATES.find((p) => p.plate === saved.plate)?.plate ?? HOW_PLATE
    this.solid = saved.solid ?? HOW_SOLID
  }

  reset() {
    this.look = { ...HOW_LOOK }
    this.sheets = HOW_SHEETS
    this.plate = HOW_PLATE
    this.solid = HOW_SOLID
  }

  save() {
    if (typeof localStorage === 'undefined') return
    const saved: Saved = {
      look: diffValues(HOW_LOOK, $state.snapshot(this.look)),
      // Solo lo que difiere de fábrica: así un cambio de fábrica llega a lo que no se tocó.
      sheets: this.sheets !== HOW_SHEETS ? this.sheets : undefined,
      plate: this.plate !== HOW_PLATE ? this.plate : undefined,
      solid: this.solid !== HOW_SOLID ? this.solid : undefined,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }
}

/** `null` fuera de desarrollo: así el build no lo incluye. */
export const howLab = import.meta.env.DEV ? new HowLab() : null
