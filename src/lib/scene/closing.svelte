<script lang="ts">
  import { T } from '@threlte/core'
  import type { Link, Section } from '$lib/content.js'
  import CtaGroup from './cta-group.svelte'
  import type { SceneFrame } from './deck-logic.js'
  import Footer from './footer.svelte'
  import { footerReserve, footerTop } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Escena de cierre: título grande y botones (el primero, el principal). La
   * última escena de una página lleva el pie pegado al borde de abajo.
   */
  interface Props {
    section: Section
    links: readonly Link[]
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    d: number
    frame: SceneFrame
    /** Año del build, para el pie; sin él no hay pie. */
    year?: number
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { section, links, width, viewportWidth, viewportHeight, compact, d, frame, year, focusedHref, onmeasure, onnavigate }: Props = $props()

  const ACTION_GAP = 36

  let headHeight = $state(0)
  let ctaHeight = $state(0)

  const ctaY = $derived(-(headHeight + ACTION_GAP))

  $effect(() => {
    if (headHeight > 0 && ctaHeight > 0) onmeasure(-ctaY + ctaHeight + (year === undefined ? 0 : footerReserve(compact)))
  })

  const lag = (k: number) => d * viewportHeight * k
  /** El pie va al fondo de la ventana, o debajo del contenido si este no entra. */
  const footerY = $derived(footerTop(ctaY - ctaHeight, frame.top, viewportHeight, compact))
</script>

<SectionHead {section} {width} {compact} size="display" onmeasure={(h) => (headHeight = h)} />
<T.Group position.y={lag(0.18)}>
  <CtaGroup {links} {width} y={ctaY} {focusedHref} onmeasure={(h) => (ctaHeight = h)} {onnavigate} />
</T.Group>

{#if year !== undefined && ctaHeight > 0}
  <T.Group position.y={lag(0.3)}>
    <Footer {width} {viewportWidth} {compact} y={footerY} {year} {focusedHref} {onnavigate} />
  </T.Group>
{/if}
