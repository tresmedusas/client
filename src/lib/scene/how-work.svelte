<script lang="ts">
  import { T } from '@threlte/core'
  import { HOW_WORK } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import CardText from './card-text.svelte'
  import Chips from './chips.svelte'
  import { grid, rows } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import Panel from './panel.svelte'
  import SectionHead from './section-head.svelte'

  /** Cómo trabajamos: los cuatro pasos en paneles de vidrio y los problemas que más resolvemos. */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, d, onmeasure }: Props = $props()

  const HEAD_GAP = 44
  const GAP = 16
  const PROBLEMS_GAP = 40
  const LABEL_GAP = 14
  const padding = $derived(compact ? 22 : 26)
  const columns = $derived(compact ? 1 : width < 900 ? 2 : 4)

  let headHeight = $state(0)
  let textHeights = $state<number[]>(HOW_WORK.steps.map(() => 0))
  let labelHeight = $state(0)
  let chipsHeight = $state(0)

  const cells = $derived(grid(width, columns, GAP))
  const measured = $derived(textHeights.every((h) => h > 0))
  const layout = $derived(rows(textHeights.map((h) => h + padding * 2), columns, GAP))
  const stepsTop = $derived(-(headHeight + HEAD_GAP))
  const labelY = $derived(stepsTop - layout.total - PROBLEMS_GAP)
  const chipsY = $derived(labelY - labelHeight - LABEL_GAP)

  $effect(() => {
    if (headHeight > 0 && measured && labelHeight > 0 && chipsHeight > 0) onmeasure(-chipsY + chipsHeight)
  })

  const cellLeft = (i: number) => cells.x(i) - cells.cellWidth / 2
  const rowOf = (i: number) => Math.floor(i / columns)
  /** Parallax: cada paso entra un poco después del anterior. */
  const lag = (k: number) => d * viewportHeight * k
</script>

<SectionHead section={HOW_WORK.section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#each HOW_WORK.steps as step, i (step.title)}
  {@const top = stepsTop - (layout.tops[rowOf(i)] ?? 0)}
  <T.Group position.y={lag(0.1 + (i % columns) * 0.06 + rowOf(i) * 0.04)}>
    {#if measured && headHeight > 0}
      <Panel x={cellLeft(i)} y={top} width={cells.cellWidth} height={layout.heights[rowOf(i)] ?? 0} />
    {/if}
    <CardText
      item={step}
      index={String(i + 1).padStart(2, '0')}
      x={cellLeft(i) + padding}
      y={top - padding}
      width={cells.cellWidth - padding * 2}
      titleSize={compact ? 19 : 20}
      bodySize={compact ? 15 : 16}
      onmeasure={(h) => (textHeights[i] = h)}
    />
  </T.Group>
{/each}

<T.Group position.y={lag(0.4)}>
  <MeasuredText
    text={HOW_WORK.problemsLabel.toUpperCase()}
    fontSize={12}
    color={PALETTE.muted}
    font={FONT.bold}
    letterSpacing={1.6}
    lineHeight={1.2}
    y={labelY}
    onmeasure={(_, h) => (labelHeight = h)}
  />
  <Chips labels={HOW_WORK.problems} {width} y={chipsY} onmeasure={(h) => (chipsHeight = h)} />
</T.Group>
