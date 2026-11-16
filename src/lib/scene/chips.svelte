<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { flow } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  /** Etiquetas en píldoras planas (sin vidrio: no suman captura), acomodadas en filas. */
  interface Props {
    labels: readonly string[]
    width: number
    /** Borde de arriba. */
    y: number
    fontSize?: number
    /** Píldoras en el brand, para destacar (las del showcase). */
    accent?: boolean
    onmeasure?: (height: number) => void
  }

  let { labels, width, y, fontSize = 14, accent = false, onmeasure }: Props = $props()

  const PAD_X = 14
  const GAP = 8
  const height = $derived(Math.round(fontSize * 2.3))

  let textWidths = $state<number[]>([])
  const measured = $derived(labels.every((_, i) => (textWidths[i] ?? 0) > 0))
  const layout = $derived(flow(labels.map((_, i) => (textWidths[i] ?? 0) + PAD_X * 2), width, GAP))

  $effect(() => {
    if (measured) onmeasure?.(layout.rows * height + (layout.rows - 1) * GAP)
  })

  const top = (i: number) => y - (layout.row[i] ?? 0) * (height + GAP)
</script>

{#each labels as label, i (label)}
  {@const w = (textWidths[i] ?? 0) + PAD_X * 2}
  {#if measured}
    <Rect
      width={w}
      {height}
      radius={height / 2}
      color={accent ? PALETTE.brand : PALETTE.ink}
      opacity={accent ? 0.14 : 0.06}
      x={(layout.x[i] ?? 0) + w / 2}
      y={top(i) - height / 2}
    />
  {/if}
  <MeasuredText
    text={label}
    {fontSize}
    color={accent ? PALETTE.brandInk : PALETTE.ink}
    lineHeight={1.2}
    anchorY={0.5}
    x={(layout.x[i] ?? 0) + PAD_X}
    y={top(i) - height / 2}
    z={0.001}
    onmeasure={(w) => (textWidths[i] = w)}
  />
{/each}
