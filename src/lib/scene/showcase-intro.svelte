<script lang="ts">
  import { T } from '@threlte/core'
  import { Rect } from 'essentia-primitives'
  import { SHOWCASE } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'
  import SectionHead from './section-head.svelte'

  /** Apertura del showcase: el título y el índice de proyectos, cada uno con su número. */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    /** Lleva a la escena del proyecto `order`. */
    onselect: (order: number) => void
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, d, onselect, onmeasure }: Props = $props()

  const LIST_GAP = 48
  const ROW = $derived(compact ? 52 : 60)

  let headHeight = $state(0)
  const listTop = $derived(-(headHeight + LIST_GAP))
  const listWidth = $derived(Math.min(width, 720))

  $effect(() => {
    if (headHeight > 0) onmeasure(-listTop + SHOWCASE.projects.length * ROW)
  })

  const lag = (k: number) => d * viewportHeight * k
</script>

<SectionHead section={SHOWCASE.section} {width} {compact} size="display" onmeasure={(h) => (headHeight = h)} />

{#each SHOWCASE.projects as project, i (project.id)}
  {@const y = listTop - i * ROW}
  <T.Group position.y={lag(0.12 + i * 0.06)}>
    <Rect width={listWidth} height={1} color={PALETTE.ink} opacity={0.14} x={listWidth / 2} {y} />
    <!-- La fila entera es el blanco del click. -->
    <Rect width={listWidth} height={ROW} color={PALETTE.black} opacity={0} x={listWidth / 2} y={y - ROW / 2} cursor="pointer" onclick={() => onselect(i)} />
    <MeasuredText
      text={String(i + 1).padStart(2, '0')}
      fontSize={14}
      color={PALETTE.brandInk}
      font={FONT.bold}
      lineHeight={1.2}
      anchorY={0.5}
      y={y - ROW / 2}
    />
    <MeasuredText
      text={project.name}
      fontSize={compact ? 18 : 22}
      color={PALETTE.ink}
      font={FONT.bold}
      lineHeight={1.2}
      anchorY={0.5}
      maxWidth={listWidth - 48 - (compact ? 0 : 200)}
      x={48}
      y={y - ROW / 2}
    />
    {#if !compact}
      <MeasuredText
        text={project.tags.join(' · ')}
        fontSize={14}
        color={PALETTE.muted}
        lineHeight={1.2}
        anchorX={1}
        anchorY={0.5}
        x={listWidth}
        y={y - ROW / 2}
      />
    {/if}
  </T.Group>
{/each}
