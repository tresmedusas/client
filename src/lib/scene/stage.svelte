<script lang="ts">
  import { EssentiaRoot } from 'essentia-core'
  import { PALETTE } from '$lib/tokens.js'
  import LandingScene from './landing-scene.svelte'
  import { NAV_SPACE } from './layout.js'
  import { ScrollState } from './scroll.svelte.js'

  interface Props {
    /** La capa semántica: de acá salen el foco y las anclas. */
    layer: HTMLElement
  }

  let { layer }: Props = $props()

  /** Las secciones en el orden en que las apila la escena (el pie no tiene ancla). */
  const SECTION_IDS = ['inicio', 'que-resolvemos', 'como-entregamos', 'sites', 'contacto'] as const
  const YEAR = new Date().getFullYear()

  // El scroll es de la escena: el contenido tiene que ser parte de ella para
  // que los vidrios lo capturen. Los eventos llegan por el DOM.
  const scroll = new ScrollState()

  let tops = $state.raw<readonly number[]>([])
  let focusedHref = $state<string | null>(null)
  /** Ancla pendiente: hasta medir toda la página, los topes no sirven. */
  let pendingAnchor = $state(location.hash.slice(1))

  // ── Movimiento ─────────────────────────────────────────────────
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let reducedMotion = $state(reduced.matches)
  let pageVisible = $state(document.visibilityState === 'visible')
  const motion = $derived(!reducedMotion && pageVisible)

  $effect(() => {
    const onChange = () => (reducedMotion = reduced.matches)
    reduced.addEventListener('change', onChange)
    return () => reduced.removeEventListener('change', onChange)
  })

  // ── Anclas ─────────────────────────────────────────────────────
  function scrollToSection(id: string) {
    const index = SECTION_IDS.indexOf(id as (typeof SECTION_IDS)[number])
    if (index <= 0) scroll.scrollTo(0)
    else {
      const top = tops[index]
      if (top !== undefined) scroll.scrollTo(top - NAV_SPACE - 24)
    }
  }

  function applyAnchor() {
    if (!pendingAnchor || tops.length === 0) return
    const id = pendingAnchor
    pendingAnchor = ''
    scrollToSection(id)
  }

  function onLayout(next: readonly number[]) {
    tops = next
    applyAnchor()
  }

  function onHashChange() {
    pendingAnchor = location.hash.slice(1)
    applyAnchor()
  }

  function onNavigate(href: string) {
    // Un arrastre que termina sobre un link no es un click.
    if (scroll.dragged) return
    if (href.startsWith('#')) {
      history.replaceState(null, '', href === '#inicio' ? location.pathname : href)
      scrollToSection(href.slice(1))
    } else if (href.startsWith('mailto:')) {
      window.location.href = href
    } else {
      window.open(href, '_blank', 'noopener')
    }
  }

  // ── Foco ───────────────────────────────────────────────────────
  // El foco del teclado vive en la capa semántica: Tab recorre sus links y la
  // escena lleva su sección a la vista y le dibuja el anillo.
  function onFocusIn(e: FocusEvent) {
    const target = e.target as Element
    focusedHref = target.getAttribute('href')
    const section = target.closest('section')
    if (section) scrollToSection(section.id)
  }

  function onFocusOut() {
    focusedHref = null
  }

  $effect(() => {
    layer.addEventListener('focusin', onFocusIn)
    layer.addEventListener('focusout', onFocusOut)
    return () => {
      layer.removeEventListener('focusin', onFocusIn)
      layer.removeEventListener('focusout', onFocusOut)
    }
  })

  // ── Entrada ────────────────────────────────────────────────────
  function onWheel(e: WheelEvent) {
    e.preventDefault()
    // deltaMode 1 = líneas, 2 = páginas (algunos mouse y Firefox).
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
    scroll.wheel(e.deltaY * unit)
  }

  // Sin setPointerCapture: le quitaría los eventos al canvas.
  function onPointerDown(e: PointerEvent) {
    if (e.button === 0) scroll.dragStart(e.clientY, e.timeStamp)
  }

  function onKeyDown(e: KeyboardEvent) {
    const target = e.target as Element
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return
    const page = window.innerHeight * 0.8
    const steps: Record<string, number> = { ArrowDown: 80, ArrowUp: -80, PageDown: page, PageUp: -page, ' ': page }
    if (e.key === 'Home') scroll.scrollTo(0)
    else if (e.key === 'End') scroll.scrollTo(Infinity)
    else if (e.key in steps) scroll.wheel(e.shiftKey && e.key === ' ' ? -page : (steps[e.key] as number))
    else return
    e.preventDefault()
  }
</script>

<svelte:window
  onhashchange={onHashChange}
  onkeydown={onKeyDown}
  onpointermove={(e) => scroll.dragMove(e.clientY, e.timeStamp)}
  onpointerup={() => scroll.dragEnd()}
  onpointercancel={() => scroll.dragEnd()}
/>
<svelte:document onvisibilitychange={() => (pageVisible = document.visibilityState === 'visible')} />

<!-- Sin aria-hidden: la capa del bridge de Essentia vive acá adentro. -->
<div class="stage" role="presentation" onwheel={onWheel} onpointerdown={onPointerDown}>
  <EssentiaRoot background={PALETTE.abyss}>
    <LandingScene {scroll} {motion} {focusedHref} year={YEAR} onlayout={onLayout} onnavigate={onNavigate} />
  </EssentiaRoot>
</div>

<style>
  .stage {
    position: fixed;
    inset: 0;
    /* El gesto de scroll lo maneja la escena, no el navegador. */
    touch-action: none;
  }
</style>
