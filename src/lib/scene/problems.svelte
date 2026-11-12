<script lang="ts">
  import { PROBLEMS } from '$lib/content.js'
  import CardText from './card-text.svelte'
  import { grid, rows } from './layout.js'
  import Panel from './panel.svelte'
  import SectionHead from './section-head.svelte'

  interface Props {
    width: number
    compact: boolean
    onmeasure: (height: number) => void
  }

  let { width, compact, onmeasure }: Props = $props()

  const GAP = 16
  const HEAD_GAP = 48
  const padding = $derived(compact ? 22 : 30)

  let headHeight = $state(0)
  let textHeights = $state<number[]>(PROBLEMS.items.map(() => 0))

  const cells = $derived(grid(width, compact ? 1 : 2, GAP))
  const measured = $derived(textHeights.every((h) => h > 0))
  const layout = $derived(rows(textHeights.map((h) => h + padding * 2), cells.columns, GAP))
  const gridTop = $derived(-(headHeight + HEAD_GAP))

  $effect(() => {
    if (headHeight > 0 && measured) onmeasure(-gridTop + layout.total)
  })

  const cellLeft = (i: number) => cells.x(i) - cells.cellWidth / 2
  const rowOf = (i: number) => Math.floor(i / cells.columns)
</script>

<SectionHead section={PROBLEMS.section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#each PROBLEMS.items as item, i (item.title)}
  {@const top = gridTop - (layout.tops[rowOf(i)] ?? 0)}
  {#if measured && headHeight > 0}
    <Panel x={cellLeft(i)} y={top} width={cells.cellWidth} height={layout.heights[rowOf(i)] ?? 0} />
  {/if}
  <CardText
    {item}
    x={cellLeft(i) + padding}
    y={top - padding}
    width={cells.cellWidth - padding * 2}
    onmeasure={(h) => (textHeights[i] = h)}
  />
{/each}
