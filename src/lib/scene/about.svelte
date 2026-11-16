<script lang="ts">
  import { T } from '@threlte/core'
  import { ABOUT } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { grid, rows } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import Panel from './panel.svelte'
  import PersonCard from './person-card.svelte'
  import SectionHead from './section-head.svelte'

  /** Nosotros: los tres fundadores en paneles de vidrio y el equipo en una grilla. */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, d, onmeasure }: Props = $props()

  const HEAD_GAP = 40
  const GAP = 16
  const TEAM_GAP = 36
  const LABEL_GAP = 16
  const padding = $derived(compact ? 22 : 26)
  const founderColumns = $derived(compact ? 1 : 3)
  const teamColumns = $derived(compact ? 2 : 4)

  let headHeight = $state(0)
  let founderHeights = $state<number[]>(ABOUT.founders.map(() => 0))
  let teamLabelHeight = $state(0)
  let teamHeights = $state<number[]>(ABOUT.team.map(() => 0))

  const founderCells = $derived(grid(width, founderColumns, GAP))
  const teamCells = $derived(grid(width, teamColumns, compact ? 12 : 24))
  const foundersMeasured = $derived(founderHeights.every((h) => h > 0))
  const teamMeasured = $derived(teamHeights.every((h) => h > 0))
  const founderRows = $derived(rows(founderHeights.map((h) => h + padding * 2), founderColumns, GAP))
  const teamRows = $derived(rows(teamHeights, teamColumns, 18))
  const foundersTop = $derived(-(headHeight + HEAD_GAP))
  const teamLabelY = $derived(foundersTop - founderRows.total - TEAM_GAP)
  const teamTop = $derived(teamLabelY - teamLabelHeight - LABEL_GAP)

  $effect(() => {
    if (headHeight > 0 && foundersMeasured && teamLabelHeight > 0 && teamMeasured) onmeasure(-teamTop + teamRows.total)
  })

  const left = (cells: { x: (i: number) => number; cellWidth: number }, i: number) => cells.x(i) - cells.cellWidth / 2
  const lag = (k: number) => d * viewportHeight * k
</script>

<SectionHead section={ABOUT.section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#each ABOUT.founders as person, i (person.name)}
  {@const row = Math.floor(i / founderColumns)}
  {@const top = foundersTop - (founderRows.tops[row] ?? 0)}
  <T.Group position.y={lag(0.1 + (i % founderColumns) * 0.07 + row * 0.05)}>
    {#if foundersMeasured && headHeight > 0}
      <Panel x={left(founderCells, i)} y={top} width={founderCells.cellWidth} height={founderRows.heights[row] ?? 0} />
    {/if}
    <PersonCard
      {person}
      variant="card"
      x={left(founderCells, i) + padding}
      y={top - padding}
      width={founderCells.cellWidth - padding * 2}
      onmeasure={(h) => (founderHeights[i] = h)}
    />
  </T.Group>
{/each}

<T.Group position.y={lag(0.4)}>
  <MeasuredText
    text={ABOUT.teamLabel.toUpperCase()}
    fontSize={12}
    color={PALETTE.muted}
    font={FONT.bold}
    letterSpacing={1.6}
    lineHeight={1.2}
    y={teamLabelY}
    onmeasure={(_, h) => (teamLabelHeight = h)}
  />
  {#each ABOUT.team as person, i (person.name)}
    <PersonCard
      {person}
      variant="row"
      x={left(teamCells, i)}
      y={teamTop - (teamRows.tops[Math.floor(i / teamColumns)] ?? 0)}
      width={teamCells.cellWidth}
      z={0}
      onmeasure={(h) => (teamHeights[i] = h)}
    />
  {/each}
</T.Group>
