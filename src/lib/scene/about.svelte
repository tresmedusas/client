<script lang="ts">
  import { ABOUT } from '$lib/content.js'
  import { openFounder } from '$lib/founder-dialog.svelte.js'
  import FounderCard from './founder-card.svelte'
  import { NAV_SPACE, SCENE_BOTTOM, grid } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Nosotros: los tres fundadores como protagonistas, cada uno en su card con
   * su foto. La fila (o la columna, en un teléfono) va centrada como
   * bloque; un clic en la card abre el modal del fundador.
   *
   * En escritorio la escena llena la ventana (pedido del usuario,
   * 2026-11-25): las cards crecen hasta ocupar el alto que deja el
   * encabezado, sin pasar el ancho de su celda.
   */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    /** Link de la capa semántica con el foco del teclado. */
    focusedHref: string | null
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, focusedHref, onmeasure }: Props = $props()

  const HEAD_GAP = 48
  const GAP = $derived(compact ? 24 : 32)
  /** Proporción de la card (alto / ancho), la de la referencia. */
  const ASPECT = 1.4
  const columns = $derived(compact ? 1 : 3)

  let headHeight = $state(0)

  /** Card más chica en escritorio: por debajo, la escena scrollea adentro. */
  const MIN_WIDTH = 280
  /** Cuánto puede estirarse la card más allá de su proporción para llenar el alto. */
  const STRETCH = 1.15

  const cellWidth = $derived(grid(width, columns, GAP).cellWidth)
  /** Alto que queda para las cards bajo el encabezado, en el área de la escena. */
  const fill = $derived(viewportHeight - NAV_SPACE - SCENE_BOTTOM - headHeight - HEAD_GAP)
  /** La fila de cards, centrada en la columna. En un teléfono, apiladas y con su proporción. */
  const cardHeight = $derived(
    compact
      ? Math.round(Math.min(320, cellWidth) * ASPECT)
      : Math.round(Math.min(Math.max(fill, MIN_WIDTH * ASPECT), cellWidth * ASPECT * STRETCH)),
  )
  const cardWidth = $derived(compact ? Math.min(320, cellWidth) : Math.min(cellWidth, cardHeight / ASPECT))
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
</script>

<SectionHead section={ABOUT.section} {width} {compact} align="center" onmeasure={(h) => (headHeight = h)} />

{#if headHeight > 0}
  {#each ABOUT.founders as person, i (person.id)}
    <FounderCard
      {person}
      x={centerX(i)}
      y={centerY(i)}
      width={cardWidth}
      height={cardHeight}
      {compact}
      focused={focusedHref === `#${person.id}`}
      onopen={openFounder}
    />
  {/each}
{/if}
