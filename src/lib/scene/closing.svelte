<script lang="ts">
  import { T } from '@threlte/core'
  import { Rect } from 'essentia-primitives'
  import { FOOTER, SITE, type Link, type Section } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import CtaGroup from './cta-group.svelte'
  import type { SceneFrame } from './deck-logic.js'
  import MeasuredText from './measured-text.svelte'
  import SectionHead from './section-head.svelte'

  /**
   * Escena de cierre: título grande y botones (el primero, el principal). La
   * última escena de una página lleva el pie pegado al borde de abajo.
   */
  interface Props {
    section: Section
    links: readonly Link[]
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    frame: SceneFrame
    /**
     * `center`: encabezado y botones centrados (DESIGN.md §6), como Contacto.
     * El cierre del showcase todavía va a la izquierda. @default 'start'
     */
    align?: 'start' | 'center'
    /** Año del build, para el pie; sin él no hay pie. */
    year?: number
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { section, links, width, viewportHeight, compact, d, frame, align = 'start', year, focusedHref, onmeasure, onnavigate }: Props = $props()

  const ACTION_GAP = 36
  /** Lo que ocupa el pie: la escena lo reserva para que el contenido no lo pise. */
  const FOOTER_SPACE = 72

  let headHeight = $state(0)
  let ctaHeight = $state(0)

  const ctaY = $derived(-(headHeight + ACTION_GAP))

  $effect(() => {
    if (headHeight > 0 && ctaHeight > 0) onmeasure(-ctaY + ctaHeight + (year === undefined ? 0 : FOOTER_SPACE))
  })

  const lag = (k: number) => d * viewportHeight * k
  /** El pie va al fondo de la ventana, o debajo del contenido si este no entra. */
  const footerY = $derived(Math.min(frame.top - viewportHeight + 40 + 40, ctaY - ctaHeight - 40))
</script>

<SectionHead {section} {width} {compact} size="display" {align} onmeasure={(h) => (headHeight = h)} />
<T.Group position.y={lag(0.18)}>
  <CtaGroup {links} {width} y={ctaY} {focusedHref} {align} onmeasure={(h) => (ctaHeight = h)} {onnavigate} />
</T.Group>

{#if year !== undefined && ctaHeight > 0}
  <T.Group position.y={footerY + lag(0.3)}>
    <Rect width={width} height={1} color={PALETTE.ink} opacity={0.14} x={width / 2} y={0} />
    <MeasuredText text={SITE.name} fontSize={14} color={PALETTE.ink} font={FONT.bold} lineHeight={1.2} y={-18} />
    <MeasuredText
      text={compact ? FOOTER.copyright(year) : `${FOOTER.tagline}  ·  ${FOOTER.copyright(year)}`}
      fontSize={13}
      color={PALETTE.muted}
      lineHeight={1.2}
      anchorX={1}
      x={width}
      y={-19}
    />
  </T.Group>
{/if}
