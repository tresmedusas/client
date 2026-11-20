<script lang="ts">
  import { T } from '@threlte/core'
  import { ABOUT } from '$lib/content.js'
  import { openFounder } from '$lib/founder-dialog.svelte.js'
  import FounderCard from './founder-card.svelte'
  import { grid } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Nosotros: los tres fundadores como protagonistas, cada uno en su card
   * holográfica. La fila (o la columna, en un teléfono) va centrada como
   * bloque; «Conocer a …» abre el modal del fundador.
   */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    /** Link de la capa semántica con el foco del teclado. */
    focusedHref: string | null
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, d, focusedHref, onmeasure }: Props = $props()

  const HEAD_GAP = 48
  const GAP = $derived(compact ? 24 : 32)
  /** Proporción de la card (alto / ancho), la de la referencia. */
  const ASPECT = 1.4
  const columns = $derived(compact ? 1 : 3)

  let headHeight = $state(0)

  /** La fila de cards, centrada en la columna. */
  const cardWidth = $derived(Math.min(compact ? 320 : 280, grid(width, columns, GAP).cellWidth))
  const cardHeight = $derived(Math.round(cardWidth * ASPECT))
  const rowWidth = $derived(cardWidth * columns + GAP * (columns - 1))
  const rowLeft = $derived((width - rowWidth) / 2)
  const top = $derived(-(headHeight + HEAD_GAP))
  const rowCount = $derived(Math.ceil(ABOUT.founders.length / columns))
  const total = $derived(rowCount * cardHeight + (rowCount - 1) * GAP)

  $effect(() => {
    if (headHeight > 0) onmeasure(-top + total)
  })

  const centerX = (i: number) => rowLeft + (i % columns) * (cardWidth + GAP) + cardWidth / 2
  const centerY = (i: number) => top - Math.floor(i / columns) * (cardHeight + GAP) - cardHeight / 2
  /** Parallax: cada fundador entra un poco después del anterior. */
  const lag = (k: number) => d * viewportHeight * k
</script>

<SectionHead section={ABOUT.section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#if headHeight > 0}
  {#each ABOUT.founders as person, i (person.id)}
    <T.Group position.y={lag(0.1 + (i % columns) * 0.08 + Math.floor(i / columns) * 0.05)}>
      <FounderCard
        {person}
        index={i + 1}
        x={centerX(i)}
        y={centerY(i)}
        width={cardWidth}
        height={cardHeight}
        {compact}
        focused={focusedHref === `#${person.id}`}
        onopen={openFounder}
      />
    </T.Group>
  {/each}
{/if}
