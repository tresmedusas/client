<script lang="ts">
  import { T } from '@threlte/core'
  import { TERMS } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import type { SceneFrame } from './deck-logic.js'
  import Footer from './footer.svelte'
  import { footerReserve, footerTop, stack } from './layout.js'
  import LeadInText from './lead-in-text.svelte'
  import MeasuredText from './measured-text.svelte'
  import SectionHead from './section-head.svelte'

  /**
   * Términos y condiciones (página de ejemplo): encabezado y un bloque por
   * tema, centrados (DESIGN.md §6), con el pie al final.
   */
  interface Props {
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    frame: SceneFrame
    year: number
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportWidth, viewportHeight, compact, frame, year, focusedHref, onmeasure, onnavigate }: Props = $props()

  /** Aire entre el encabezado y el primer tema, y entre temas. */
  const HEAD_GAP = 56
  const ITEM_GAP = 40
  const TITLE_GAP = 10
  /** Medida corta para un párrafo centrado: ~60 caracteres a 17 px. */
  const BODY_WIDTH = 520

  const mid = $derived(width / 2)
  const bodyWidth = $derived(Math.min(width, BODY_WIDTH))

  let headHeight = $state(0)
  let titleHeights = $state(TERMS.items.map(() => 0))
  let bodyHeights = $state(TERMS.items.map(() => 0))

  const measured = $derived(headHeight > 0 && titleHeights.every((h) => h > 0) && bodyHeights.every((h) => h > 0))
  const items = $derived(stack(TERMS.items.map((_, i) => titleHeights[i]! + TITLE_GAP + bodyHeights[i]!), ITEM_GAP))
  const itemsTop = $derived(headHeight + HEAD_GAP)
  const contentHeight = $derived(itemsTop + items.total)

  $effect(() => {
    if (measured) onmeasure(contentHeight + footerReserve(compact))
  })

  const footerY = $derived(footerTop(-contentHeight, frame.top, viewportHeight, compact))
</script>

<SectionHead section={TERMS.section} {width} {compact} align="center" onmeasure={(h) => (headHeight = h)} />

<T.Group position.y={-itemsTop}>
  {#each TERMS.items as item, i (item.title)}
    {@const top = -(items.tops[i] ?? 0)}
    <MeasuredText
      text={item.title}
      fontSize={compact ? 18 : 19}
      color={PALETTE.ink}
      font={FONT.bold}
      lineHeight={1.25}
      maxWidth={bodyWidth}
      alignment="center"
      anchorX={0.5}
      x={mid}
      y={top}
      onmeasure={(_, h) => (titleHeights[i] = h)}
    />
    <LeadInText
      text={item.body}
      fontSize={compact ? 16 : 17}
      lineHeight={1.6}
      maxWidth={bodyWidth}
      alignment="center"
      anchorX={0.5}
      x={mid}
      y={top - (titleHeights[i] ?? 0) - TITLE_GAP}
      onmeasure={(_, h) => (bodyHeights[i] = h)}
    />
  {/each}
</T.Group>

{#if measured}
  <Footer {width} {viewportWidth} {compact} y={footerY} {year} {focusedHref} {onnavigate} />
{/if}
