<script lang="ts">
  import { untrack } from 'svelte'
  import { EssentiaRoot } from 'essentia-core'
  import { afterNavigate, goto, replaceState } from '$app/navigation'
  import { NAV, caseOf, pageOf, scenesOf, type Project } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import { Deck } from './deck.svelte.js'
  import { sceneIndex } from './deck-logic.js'
  import SiteScene from './site-scene.svelte'
  import { CASE_TRANSITION, type ScreenRect } from './case-transition.js'
  import { CaseTransition } from './case-transition.svelte.js'
  import WarpLabPanel from '$lib/lab/warp-lab-panel.svelte'
  import { lab } from '$lib/lab/warp-lab.svelte.js'

  interface Props {
    /** La capa semántica: de acá salen el foco y las anclas. */
    layer: HTMLElement
  }

  let { layer }: Props = $props()

  const YEAR = new Date().getFullYear()

  /** Ruta sin la barra final: «/» queda como está. */
  const normalize = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

  // Las escenas son de la escena: el contenido tiene que ser parte de ella para
  // que los vidrios lo capturen. Los eventos llegan por el DOM.
  const deck = new Deck()
  let path = $state(normalize(location.pathname))
  const scenes = $derived(scenesOf(path))
  const page = $derived(pageOf(path))
  const project = $derived(caseOf(path) ?? null)
  untrack(() => deck.reset(scenes.length, Math.max(0, sceneIndex(scenes, location.hash))))

  let focusedHref = $state<string | null>(null)
  /** El foco está en la navbar (el `header` de la capa semántica): un link del contenido con el mismo href no lleva el anillo, y al revés. */
  let focusInNav = $state(false)

  /** La transición al abrir un caso: en desarrollo, la que se elija en el banco de pruebas (las demos). */
  const transition = new CaseTransition()
  const transitionKind = $derived(import.meta.env.DEV && lab ? lab.transition : CASE_TRANSITION)
  $effect(() => {
    transition.speed = import.meta.env.DEV && lab?.slowTransition ? 0.2 : 1
  })

  // ── Movimiento ─────────────────────────────────────────────────
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let reducedMotion = $state(reduced.matches)
  let pageVisible = $state(document.visibilityState === 'visible')
  const motion = $derived(!reducedMotion && pageVisible)

  // Con movimiento reducido, la rueda, el arrastre y las teclas cambian de
  // escena sin transición.
  $effect(() => {
    deck.instant = reducedMotion
  })

  // En el showcase los casos pasan en fila: un gesto de costado también scrollea.
  $effect(() => {
    deck.swipeX = page === 'showcase'
  })

  $effect(() => {
    const onChange = () => (reducedMotion = reduced.matches)
    reduced.addEventListener('change', onChange)
    return () => reduced.removeEventListener('change', onChange)
  })

  // ── Escenas, anclas y rutas ────────────────────────────────────
  /** Lleva a la escena con ese ancla; con movimiento reducido, sin transición. */
  function showScene(id: string) {
    const index = sceneIndex(scenes, id)
    if (index >= 0) deck.goTo(index, reducedMotion)
  }

  afterNavigate(() => {
    const next = normalize(location.pathname)
    if (next !== path) {
      // Otra página: arranca quieta en su escena.
      path = next
      deck.reset(scenesOf(next).length, Math.max(0, sceneIndex(scenesOf(next), location.hash)))
      transition.arrive(next)
    } else if (location.hash) showScene(location.hash)
    else deck.goTo(0, reducedMotion)
  })

  // Un cambio de ancla del navegador (atrás, adelante) no siempre pasa por el router.
  function onHashChange() {
    if (location.hash) showScene(location.hash)
  }

  // La URL sigue a la escena que se ve, sin sumar entradas al historial: un
  // link copiado abre en esa escena.
  $effect(() => {
    const id = scenes[deck.index]
    if (!id) return
    const hash = deck.index === 0 ? '' : `#${id}`
    if (location.hash !== hash) untrack(() => replaceState(`${location.pathname}${hash}`, {}))
  })

  /** El link de la navbar que corresponde a lo que se ve. */
  const activeHref = $derived.by(() => {
    // Un caso es parte del showcase.
    if (page === 'showcase' || page === 'case') return '/showcase'
    if (page !== 'home') return null
    const href = `/#${scenes[deck.index]}`
    return NAV.some((l) => l.href === href) ? href : null
  })

  function onNavigate(href: string) {
    // Un arrastre que termina sobre un link no es un click.
    if (deck.dragged) return
    if (href.startsWith('mailto:')) {
      window.location.href = href
      return
    }
    if (/^https?:/.test(href)) {
      window.open(href, '_blank', 'noopener')
      return
    }
    const url = new URL(href, location.href)
    if (normalize(url.pathname) === path) {
      // La misma página: solo cambia de escena.
      if (url.hash) showScene(url.hash)
      else deck.goTo(0, reducedMotion)
    } else void goto(`${url.pathname}${url.hash}`)
  }

  /** Click en una card del showcase: la transición y, a mitad de ella, la página del caso. */
  function onOpenCase(project: Project, index: number, href: string, from: ScreenRect) {
    if (deck.dragged || transition.active) return
    if (reducedMotion) {
      void goto(href)
      return
    }
    transition.start(transitionKind, project, index, href, from, () => void goto(href))
  }

  // ── Foco ───────────────────────────────────────────────────────
  // El foco del teclado vive en la capa semántica: Tab recorre sus links y la
  // escena lleva su sección a la vista y le dibuja el anillo.
  function onFocusIn(e: FocusEvent) {
    const target = e.target as Element
    focusedHref = target.getAttribute('href')
    focusInNav = !!target.closest('header')
    const section = target.closest('section[id]')
    if (section) showScene(section.id)
    // El pie se dibuja en la última escena.
    else if (target.closest('footer')) deck.goTo(deck.count - 1, reducedMotion)
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
    // Durante la transición a un caso, la escena no se mueve.
    if (transition.active) return
    // deltaMode 1 = líneas, 2 = páginas (algunos mouse y Firefox).
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
    // Un trackpad de costado no cambia de escena, salvo donde los casos pasan en fila.
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
      if (deck.swipeX) deck.wheel(e.deltaX * unit, e.timeStamp)
      return
    }
    deck.wheel(e.deltaY * unit, e.timeStamp)
  }

  // Sin setPointerCapture: le quitaría los eventos al canvas.
  function onPointerDown(e: PointerEvent) {
    if (e.button === 0 && !transition.active) deck.dragStart(e.clientY, e.timeStamp, e.clientX)
  }

  function onKeyDown(e: KeyboardEvent) {
    const target = e.target as Element
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return
    if (transition.active) return
    const pageStep = window.innerHeight * 0.8
    const steps: Record<string, number> = { ArrowDown: 80, ArrowUp: -80, PageDown: pageStep, PageUp: -pageStep, ' ': pageStep }
    if (e.key === 'Home') deck.goTo(0)
    else if (e.key === 'End') deck.goTo(deck.count - 1)
    else if (e.key in steps) deck.step(e.shiftKey && e.key === ' ' ? -pageStep : (steps[e.key] as number))
    else return
    e.preventDefault()
  }
</script>

<svelte:window
  onhashchange={onHashChange}
  onkeydown={onKeyDown}
  onpointermove={(e) => deck.dragMove(e.clientY, e.timeStamp, e.clientX)}
  onpointerup={(e) => deck.dragEnd(e.timeStamp)}
  onpointercancel={() => deck.dragEnd()}
/>
<svelte:document onvisibilitychange={() => (pageVisible = document.visibilityState === 'visible')} />

<!-- Sin aria-hidden: la capa del bridge de Essentia vive acá adentro. -->
<div class="stage" role="presentation" onwheel={onWheel} onpointerdown={onPointerDown}>
  <!-- Luz global (la del preset del lente de la navbar): azimut −57°, elevación −83°. -->
  <EssentiaRoot background={PALETTE.paper} light={{ direction: [0.0664, -0.1022, -0.9925], intensity: 0.7 }}>
    <SiteScene
      {deck}
      {page}
      {project}
      {transition}
      {motion}
      {focusedHref}
      {focusInNav}
      {activeHref}
      year={YEAR}
      onnavigate={onNavigate}
      onopencase={onOpenCase}
      onselect={(i) => deck.goTo(i, reducedMotion)}
    />
  </EssentiaRoot>
</div>

<!-- Banco de pruebas de los bordes: solo en desarrollo (no entra al build). Afuera del stage: la rueda no cambia de escena. -->
{#if import.meta.env.DEV}
  <WarpLabPanel {page} />
{/if}

<style>
  .stage {
    position: fixed;
    inset: 0;
    /* El gesto lo maneja el deck, no el navegador. */
    touch-action: none;
  }
</style>
