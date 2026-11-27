import type { Project } from '$lib/content.js'
import { TRANSITION_DURATION, type ScreenRect, type TransitionKind, type TransitionPhase } from './case-transition.js'

/**
 * El estado de la transición al abrir un caso, o al volver de él al showcase
 * (ver `case-transition.ts`). La arranca el stage: con el click en una card,
 * o al ir de la página de un caso al showcase; avanza desde un `useTask` de
 * la escena mientras está activa. Al terminar la fase `out` llama a `onout`
 * (que cambia de página) y espera a `arrive`; con una card (`open`), la fase
 * `in` espera a que la página nueva informe dónde queda (`to`): la del caso,
 * su previsualización; el showcase, la card del caso.
 */
export class CaseTransition {
  kind = $state<TransitionKind>('open')
  phase = $state<TransitionPhase>('idle')
  /** Progreso de la fase, de 0 a 1, sin suavizar. */
  t = $state(0)
  /** El caso que se abre (o del que se vuelve) y su lugar en el showcase (elige la previsualización de prueba). */
  project = $state<Project | null>(null)
  index = $state(0)
  /** Dónde está la card al salir, en la ventana. */
  from = $state<ScreenRect | null>(null)
  /** Dónde queda la card en la página nueva. */
  to = $state<ScreenRect | null>(null)
  /**
   * Dónde está ahora la previsualización de la página del caso que se ve: de
   * ahí sale la card al volver al showcase. Lo borra el stage al cambiar de página.
   */
  placed: ScreenRect | null = null
  /** Velocidad: menos de 1, en cámara lenta (el banco de pruebas, para mirarla). */
  speed = 1

  private href = ''
  private onout: (() => void) | null = null

  get active(): boolean {
    return this.phase !== 'idle'
  }

  /** `card`: el caso y dónde está su card al salir (sin ella, la transición no lleva card). */
  start(kind: TransitionKind, href: string, onout: () => void, card?: { project: Project; index: number; from: ScreenRect }): void {
    this.kind = kind
    this.project = card?.project ?? null
    this.index = card?.index ?? 0
    this.href = href
    this.from = card?.from ?? null
    this.to = null
    this.onout = onout
    this.phase = 'out'
    this.t = 0
  }

  advance(delta: number): void {
    if (this.phase === 'idle') return
    // La card necesita saber adónde va (la página nueva todavía no midió).
    if (this.phase === 'in' && this.kind !== 'swallow' && this.from && !this.to) return
    this.t = Math.min(1, this.t + (delta * this.speed) / Math.max(1e-3, TRANSITION_DURATION[this.kind][this.phase]))
    if (this.t < 1) return
    if (this.phase === 'out') {
      const onout = this.onout
      this.onout = null
      onout?.()
    } else this.finish()
  }

  /** Cambió la página: si es la esperada, la fase `in`; si no (atrás, otro link), se corta. */
  arrive(path: string): void {
    if (this.phase === 'idle') return
    if (path !== this.href) return this.finish()
    this.phase = 'in'
    this.t = 0
    // Lo que informó la página anterior no es el destino.
    this.to = null
  }

  /** `case`: la página del caso informa dónde está su previsualización; `showcase`: dónde queda la card que vuelve. */
  anchor(rect: ScreenRect, page: 'case' | 'showcase'): void {
    if (page === 'case') this.placed = rect
    if (this.phase === 'in') this.to = rect
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
