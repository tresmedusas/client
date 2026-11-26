import type { Project } from '$lib/content.js'
import { TRANSITION_DURATION, type ScreenRect, type TransitionKind, type TransitionPhase } from './case-transition.js'

/**
 * El estado de la transición al abrir un caso (ver `case-transition.ts`). La
 * arranca el stage con el click en una card; avanza desde un `useTask` de la
 * escena mientras está activa. Al terminar la fase `out` llama a `onout` (que
 * cambia de página) y espera a `arrive`; la fase `in` espera a que la página
 * del caso informe dónde queda la card (`to`).
 */
export class CaseTransition {
  kind = $state<TransitionKind>('open')
  phase = $state<TransitionPhase>('idle')
  /** Progreso de la fase, de 0 a 1, sin suavizar. */
  t = $state(0)
  /** El caso que se abre y su lugar en el showcase (elige la previsualización de prueba). */
  project = $state<Project | null>(null)
  index = $state(0)
  /** La card que se tocó, en la ventana. */
  from = $state<ScreenRect | null>(null)
  /** Dónde queda la card en la página del caso. */
  to = $state<ScreenRect | null>(null)
  /** Velocidad: menos de 1, en cámara lenta (el banco de pruebas, para mirarla). */
  speed = 1

  private href = ''
  private onout: (() => void) | null = null

  get active(): boolean {
    return this.phase !== 'idle'
  }

  start(kind: TransitionKind, project: Project, index: number, href: string, from: ScreenRect, onout: () => void): void {
    this.kind = kind
    this.project = project
    this.index = index
    this.href = href
    this.from = from
    this.to = null
    this.onout = onout
    this.phase = 'out'
    this.t = 0
  }

  advance(delta: number): void {
    if (this.phase === 'idle') return
    // La card necesita saber adónde va (la página del caso todavía no midió).
    if (this.phase === 'in' && this.kind !== 'swallow' && !this.to) return
    this.t = Math.min(1, this.t + (delta * this.speed) / Math.max(1e-3, TRANSITION_DURATION[this.kind][this.phase]))
    if (this.t < 1) return
    if (this.phase === 'out') {
      const onout = this.onout
      this.onout = null
      onout?.()
    } else this.finish()
  }

  /** Cambió la página: si es la del caso, la fase `in`; si no (atrás, otro link), se corta. */
  arrive(path: string): void {
    if (this.phase === 'idle') return
    if (path !== this.href) return this.finish()
    this.phase = 'in'
    this.t = 0
  }

  /** La página del caso informa dónde queda su card. */
  anchor(rect: ScreenRect): void {
    if (this.phase === 'in' || this.phase === 'out') this.to = rect
  }

  finish(): void {
    this.phase = 'idle'
    this.t = 0
    this.project = null
    this.from = null
    this.to = null
    this.onout = null
  }
}
