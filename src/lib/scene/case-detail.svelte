<script lang="ts">
  import { T } from '@threlte/core'
  import { CASE_PAGE, SHOWCASE, caseSection, type Project } from '$lib/content.js'
  import BackButton from './back-button.svelte'
  import CaseCard from './case-card.svelte'
  import type { ScreenRect } from './case-transition.js'
  import type { SceneFrame } from './deck-logic.js'
  import Footer from './footer.svelte'
  import { CASE_LOOK, CTA_HEIGHT, footerReserve, footerTop } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * La página de un caso (pedido del usuario, 2026-11-25), que abre su card en
   * el showcase: el nombre (el título) y el contexto, centrados (DESIGN.md
   * §6), con el botón de volver al showcase (una flecha) al costado izquierdo
   * del título; debajo, la previsualización grande, como la card del
   * showcase, y el pie. Sin etiqueta ni «Agendar reunión» (pedido del
   * usuario, 2026-11-26).
   */
  interface Props {
    project: Project
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    frame: SceneFrame
    /** La y en la ventana (origen en el centro, hacia arriba) del tope del contenido. */
    originY: number
    /** La card no se dibuja: la transición la trae volando. */
    hideCard: boolean
    year: number
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
    /** Dónde está la card en la ventana. */
    onanchor: (rect: ScreenRect) => void
  }

  let { project, width, viewportWidth, viewportHeight, compact, frame, originY, hideCard, year, focusedHref, onmeasure, onnavigate, onanchor }: Props = $props()

  /** Del encabezado a la previsualización. */
  const GAP = $derived(compact ? 32 : 48)
  /** Del botón de volver al título. */
  const BACK_GAP = $derived(compact ? 12 : 24)

  const section = $derived(caseSection(project))
  /** Su lugar en el showcase: elige la previsualización de prueba del banco de pruebas. */
  const index = $derived(Math.max(0, SHOWCASE.projects.findIndex((p) => p.id === project.id)))
  /** La previsualización, con la proporción y el ancho máximo de las cards del showcase. */
  const cardWidth = $derived(Math.round(compact ? width : Math.min(width, CASE_LOOK.maxWidth)))
  const cardHeight = $derived(Math.round(cardWidth / (compact ? CASE_LOOK.compactAspect : CASE_LOOK.aspect)))

  let headHeight = $state(0)
  let title = $state<{ width: number; top: number; line: number } | null>(null)

  const cardTop = $derived(headHeight + GAP)
  const contentHeight = $derived(cardTop + cardHeight)

  const measured = $derived(headHeight > 0 && title !== null)

  /** El título deja lugar al botón a cada costado, así sigue centrado. */
  const titleMaxWidth = $derived(width - 2 * (CTA_HEIGHT + BACK_GAP))
  /** El botón, a la izquierda de la línea más larga del título y centrado en la primera. */
  const back = $derived(title ? { x: width / 2 - title.width / 2 - BACK_GAP - CTA_HEIGHT / 2, y: -(title.top + title.line / 2) } : null)

  $effect(() => {
    if (measured) onmeasure(contentHeight + footerReserve(compact))
  })

  const footerY = $derived(footerTop(-contentHeight, frame.top, viewportHeight, compact))

  /** La card en la ventana: el destino de la transición «la card se abre». */
  $effect(() => {
    if (measured) onanchor({ x: 0, y: originY - cardTop - cardHeight / 2, width: cardWidth, height: cardHeight })
  })
</script>

<SectionHead {section} {width} {compact} align="center" {titleMaxWidth} onmeasure={(h) => (headHeight = h)} ontitle={(t) => (title = t)} />

{#if back}
  <BackButton link={CASE_PAGE.back} x={back.x} y={back.y} focused={focusedHref === CASE_PAGE.back.href} {onnavigate} />
{/if}

{#if !hideCard}
  <T.Group position.y={-cardTop}>
    <CaseCard {project} {index} cx={width / 2} y={0} {cardWidth} {cardHeight} />
  </T.Group>
{/if}

{#if measured}
  <Footer {width} {viewportWidth} {compact} y={footerY} {year} {focusedHref} {onnavigate} />
{/if}
