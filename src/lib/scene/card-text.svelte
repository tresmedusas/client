<script lang="ts">
  import { untrack } from 'svelte'
  import type { Item } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    item: Item
    /** Número que va arriba, en el acento («01»). Sin él, solo título y cuerpo. */
    index?: string
    /** Esquina de arriba a la izquierda del texto. */
    x: number
    y: number
    width: number
    titleSize?: number
    bodySize?: number
    /** z del texto: 1.01 sobre un panel de vidrio, 0 sin panel. */
    z?: number
    onmeasure: (height: number) => void
  }

  let { item, index, x, y, width, titleSize = 20, bodySize = 16, z = 1.01, onmeasure }: Props = $props()

  const INDEX_SIZE = 15

  // Los props no cambian de contenido en esta landing: la ausencia se fija al montar.
  let indexHeight = $state(untrack(() => (index ? 0 : -1)))
  let titleHeight = $state(0)
  let bodyHeight = $state(0)

  const titleY = $derived(indexHeight > 0 ? -(indexHeight + 14) : 0)
  const bodyY = $derived(titleY - titleHeight - 10)

  $effect(() => {
    if (indexHeight === 0 || titleHeight === 0 || bodyHeight === 0) return
    onmeasure(-bodyY + bodyHeight)
  })
</script>

{#if index}
  <MeasuredText
    text={index}
    fontSize={INDEX_SIZE}
    color={PALETTE.accent}
    font={FONT.bold}
    letterSpacing={1}
    lineHeight={1.2}
    {x}
    {y}
    {z}
    onmeasure={(_, h) => (indexHeight = h)}
  />
{/if}
<MeasuredText
  text={item.title}
  fontSize={titleSize}
  color={PALETTE.text}
  font={FONT.semibold}
  lineHeight={1.3}
  maxWidth={width}
  {x}
  y={y + titleY}
  {z}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<MeasuredText
  text={item.body}
  fontSize={bodySize}
  color={PALETTE.muted}
  lineHeight={1.55}
  maxWidth={width}
  {x}
  y={y + bodyY}
  {z}
  onmeasure={(_, h) => (bodyHeight = h)}
/>
