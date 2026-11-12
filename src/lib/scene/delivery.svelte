<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { DELIVERY } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import CardText from './card-text.svelte'
  import { grid, rows } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import Panel from './panel.svelte'
  import SectionHead from './section-head.svelte'

  interface Props {
    width: number
    compact: boolean
    onmeasure: (height: number) => void
  }

  let { width, compact, onmeasure }: Props = $props()

  const HEAD_GAP = 48
  const LINE_GAP = 22
  const ROW_GAP = 36
  const NOTE_GAP = 36
  const EVIDENCE_GAP = 24
  const padding = $derived(compact ? 22 : 32)
  const columns = $derived(compact ? 1 : width < 900 ? 2 : 4)
  const gap = $derived(compact ? 0 : 28)

  let headHeight = $state(0)
  let stepHeights = $state<number[]>(DELIVERY.steps.map(() => 0))
  let noteHeight = $state(0)
  let evidenceHeight = $state(0)

  const cells = $derived(grid(width, columns, gap))
  const stepsMeasured = $derived(stepHeights.every((h) => h > 0))
  const layout = $derived(rows(stepHeights.map((h) => h + LINE_GAP), columns, ROW_GAP))
  const stepsTop = $derived(-(headHeight + HEAD_GAP))
  const noteY = $derived(stepsTop - layout.total - NOTE_GAP)
  const evidenceY = $derived(noteY - noteHeight - EVIDENCE_GAP)
  const evidencePanelHeight = $derived(evidenceHeight + padding * 2)

  $effect(() => {
    if (headHeight > 0 && stepsMeasured && noteHeight > 0 && evidenceHeight > 0) onmeasure(-evidenceY + evidencePanelHeight)
  })

  const cellLeft = (i: number) => cells.x(i) - cells.cellWidth / 2
  const stepTop = (i: number) => stepsTop - (layout.tops[Math.floor(i / columns)] ?? 0)
</script>

<SectionHead section={DELIVERY.section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#each DELIVERY.steps as step, i (step.title)}
  <!-- La línea de arriba de cada paso: tenue, con el tramo inicial en el acento. -->
  <Rect width={cells.cellWidth} height={1} color={PALETTE.muted} opacity={0.25} x={cellLeft(i) + cells.cellWidth / 2} y={stepTop(i)} />
  <Rect width={40} height={2} radius={1} color={PALETTE.accent} x={cellLeft(i) + 20} y={stepTop(i)} z={0.001} />
  <CardText
    item={step}
    index={String(i + 1).padStart(2, '0')}
    x={cellLeft(i)}
    y={stepTop(i) - LINE_GAP}
    width={cells.cellWidth - (compact ? 0 : 8)}
    titleSize={18}
    bodySize={15}
    z={0}
    onmeasure={(h) => (stepHeights[i] = h)}
  />
{/each}

<MeasuredText
  text={DELIVERY.note}
  fontSize={compact ? 17 : 19}
  color={PALETTE.text}
  lineHeight={1.5}
  maxWidth={width}
  y={noteY}
  onmeasure={(_, h) => (noteHeight = h)}
/>

{#if evidenceHeight > 0}
  <Panel x={0} y={evidenceY} {width} height={evidencePanelHeight} accent />
{/if}
<CardText
  item={DELIVERY.evidence}
  x={padding}
  y={evidenceY - padding}
  width={Math.min(width - padding * 2, 720)}
  titleSize={compact ? 21 : 24}
  bodySize={compact ? 16 : 17}
  onmeasure={(h) => (evidenceHeight = h)}
/>
