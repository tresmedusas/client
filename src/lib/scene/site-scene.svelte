<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Rect } from 'essentia-primitives'
  import { SHOWCASE, type Page, type Project } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import CaseCard from './case-card.svelte'
  import { swallowBand, swallowLook, transitionView, type ScreenRect } from './case-transition.js'
  import type { CaseTransition } from './case-transition.svelte.js'
  import CaseScene from './case-scene.svelte'
  import type { Deck } from './deck.svelte.js'
  import HomeScene from './home-scene.svelte'
  import { CASE_LOOK, columnWidth, isCompact, showcaseBand } from './layout.js'
  import Nav from './nav.svelte'
  import Backdrop from './backdrop.svelte'
  import EdgeWarp from './edge-warp.svelte'
  import { HOME_WARP, SHOWCASE_WARP, bandHeight, type WarpAxis } from './edge-warp.js'
  import { lab } from '$lib/lab/warp-lab.svelte.js'
  import SceneDots from './scene-dots.svelte'
  import ShowcaseScene from './showcase-scene.svelte'
  import TermsScene from './terms-scene.svelte'

  interface Props {
    deck: Deck
    /** Qué página se dibuja. */
    page: Page
    /** En la página de un caso, cuál. */
    project: Project | null
    /** La transición al abrir un caso o al volver de él. */
    transition: CaseTransition
    /** En el showcase, la card en la que arranca (al volver de su caso); `null`, desde el principio. */
    returnCase: number | null
    /** El movimiento continuo (medusas, haces, nieve) está permitido. */
    motion: boolean
    focusedHref: string | null
    /** El foco está en un link de la navbar (si no, en uno del contenido). */
    focusInNav: boolean
    activeHref: string | null
    year: number
    onnavigate: (href: string) => void
    /** Click en una card del showcase: `from`, dónde está en la ventana. */
    onopencase: (project: Project, index: number, href: string, from: ScreenRect) => void
    /** Click en una marca del indicador de escenas. */
    onselect: (index: number) => void
  }

  let { deck, page, project, transition, returnCase, motion, focusedHref: focused, focusInNav, activeHref, year, onnavigate, onopencase, onselect }: Props = $props()

  const engine = useEngine()

  /** El anillo de foco va solo donde está el foco: en la navbar o en el contenido. */
  const focusedHref = $derived(focusInNav ? null : focused)
  const navFocusedHref = $derived(focusInNav ? focused : null)

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)
  const compact = $derived(isCompact(vw))
  const width = $derived(columnWidth(vw))

  $effect(() => deck.setViewport(vh))

  // ── Reloj ──────────────────────────────────────────────────────
  // Corre solo mientras el hero está en pantalla y el movimiento está
  // permitido: en las demás escenas la escena se dibuja solo en las transiciones.
  const home = $derived(page === 'home')
  let time = $state(0)
  const running = $derived(motion && home && deck.position < 1)
  useTask((delta) => (time += delta), { running: () => running })
  useTask((delta) => deck.advance(delta), { running: () => deck.moving })
  useTask((delta) => transition.advance(delta), { running: () => transition.active })

  // ── Transición a un caso ───────────────────────────────────────
  const view = $derived(transitionView(transition.kind, transition.phase, transition.t, transition.from, transition.to))
  /** «La card se abre», ya en la página nueva: la card viaja, así que la de la página no se dibuja hasta que llega. */
  const landing = $derived(transition.phase === 'in' && transition.kind === 'open' && transition.project !== null)

  // ── Bordes ─────────────────────────────────────────────────────
  // En el showcase, los bordes son protagonistas: los casos pasan en fila,
  // las franjas de los costados los estiran y los bordes de arriba y abajo
  // los reflejan (pedido del usuario, 2026-11-25). En desarrollo, los
  // valores del banco de pruebas (`$lib/lab`).
  const baseWarp = $derived(
    import.meta.env.DEV && lab ? lab.looks[page === 'showcase' ? 'showcase' : 'home'] : page === 'showcase' ? SHOWCASE_WARP : HOME_WARP,
  )
  /** Con la transición «los bordes se tragan el showcase», el look se exagera. */
  const warp = $derived(swallowLook(baseWarp, view.swallow))
  const axis = $derived<WarpAxis>(page === 'showcase' ? 'horizontal' : 'vertical')
  /**
   * Tamaño de las franjas. En el showcase, las de los costados se ajustan a
   * la ventana: le dejan lugar a la card centrada (`showcaseBand`).
   */
  const cases = $derived(import.meta.env.DEV && lab ? lab.cases : CASE_LOOK)
  const restBand = $derived(page === 'showcase' ? showcaseBand(baseWarp, cases, vw, vh, compact) : bandHeight(baseWarp, vh, compact))
  /** Las cards se acomodan a las franjas de siempre; las de la transición solo se ven. */
  const band = $derived(swallowBand(restBand, axis === 'horizontal' ? vw : vh, view.swallow))
  /** Cuánto se enciende el reflejo: lo informa el showcase. */
  let focus = $state(0)
  $effect(() => {
    if (page !== 'showcase') focus = 0
  })

  // ── Logo de la navbar ──────────────────────────────────────────
  // Mientras se ve el hero, que ya presenta la marca, la navbar va sin logo:
  // aparece a medida que el hero se va (posición 0.3 → 0.8).
  const navLogo = $derived.by(() => {
    if (!home) return 1
    const t = Math.min(1, Math.max(0, (deck.position - 0.3) / 0.5))
    return t * t * (3 - 2 * t)
  })
</script>

<Backdrop />

<!-- ── Capas (z) y niveles de captura ───────────────────────────
  -1    fondo: papel liso (fijo a la ventana)
   0    texto, líneas y placas del contenido
   1    vidrios del contenido: botones, paneles y lentes → nivel 1
   1.01 texto sobre los paneles
   9.9995 bordes: franjas arriba y abajo (a los costados en el showcase) con curva (o
          estirado), aberración, blur y líquido, y reflejo en los otros dos
          (showcase) → nivel 2 (con la navbar)
  10    navbar fija (pastilla y burbuja del logo) → nivel 2; indicador de escenas
  11    lente del link activo de la navbar y vidrio de su botón → nivel 3 (el último)
-->
{#key `${page}:${project?.id ?? ''}`}
  {#if home}
    <HomeScene {deck} {width} viewportWidth={vw} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} {motion} />
  {:else if page === 'showcase'}
    <ShowcaseScene
      {deck}
      {width}
      viewportWidth={vw}
      viewportHeight={vh}
      {compact}
      band={restBand}
      look={baseWarp}
      {motion}
      {focusedHref}
      {onnavigate}
      {onopencase}
      startCase={returnCase}
      landingCase={landing ? transition.index : null}
      onanchor={(rect) => transition.anchor(rect, 'showcase')}
      onfocus={(f) => (focus = f)}
    />
  {:else if page === 'case' && project}
    <CaseScene
      {deck}
      {project}
      {width}
      viewportWidth={vw}
      viewportHeight={vh}
      {compact}
      {year}
      hideCard={landing}
      {focusedHref}
      {onnavigate}
      onanchor={(rect) => transition.anchor(rect, 'case')}
    />
  {:else}
    <TermsScene {deck} {width} viewportWidth={vw} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} />
  {/if}
{/key}

<!-- La transición a un caso (o de vuelta al showcase): el velo de papel tapa el contenido (z 5) y la card viaja sobre él (z 6), debajo de los bordes. -->
{#if view.veil > 0}
  <Rect width={vw + 2} height={vh + 2} color={PALETTE.paper} opacity={view.veil} z={5} />
{/if}
{#if view.card && transition.project}
  {@const r = view.card}
  <T.Group position.z={6}>
    <CaseCard project={transition.project} index={transition.index} cx={r.x} y={r.y + r.height / 2} cardWidth={r.width} cardHeight={r.height} />
  </T.Group>
{/if}

<!-- La fase del líquido sigue al contenido: el paso de escena, el scroll interno y el reloj del hero. -->
<EdgeWarp look={warp} {axis} {band} {focus} phase={time * 0.6 + deck.position * 2.4 + deck.innerOf(deck.index) * 0.012} />

<Nav {width} {compact} logo={navLogo} focusedHref={navFocusedHref} {activeHref} cta={page === 'showcase' ? SHOWCASE.primary : undefined} {onnavigate} />
{#if !compact && deck.count > 1}
  <SceneDots count={deck.count} position={deck.position} x={vw / 2 - 22} {onselect} />
{/if}
