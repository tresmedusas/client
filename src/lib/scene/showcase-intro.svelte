<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { SHOWCASE } from '$lib/content.js'
  import { FIGURE, FONT, PALETTE } from '$lib/tokens.js'
  import InlineHeadline from './inline-headline.svelte'
  import LeadInText from './lead-in-text.svelte'
  import MeasuredText from './measured-text.svelte'

  /**
   * Entrada a la galería, centrada: el título, la bajada y el índice de las
   * obras. Detrás, el pasillo se abre hacia el punto de fuga. Cada fila lleva
   * a su proyecto.
   */
  interface Props {
    width: number
    compact: boolean
    /** Opacidad: la entrada se desvanece al pasarla. */
    opacity: number
    focusedHref: string | null
    /** Lleva a la escena del proyecto `order`. */
    onselect: (order: number) => void
    onmeasure: (height: number) => void
  }

  let { width, compact, opacity, focusedHref, onselect, onmeasure }: Props = $props()

  const LABEL_GAP = 16
  const TITLE_GAP = 24
  const LIST_GAP = $derived(compact ? 40 : 48)
  const ROW = $derived(compact ? 56 : 64)
  /** Separación entre el número y el nombre de una fila. */
  const NUMBER_GAP = 16
  const cx = $derived(width / 2)
  /** El índice y la bajada en una medida corta: centrados se leen mejor angostos. */
  const listWidth = $derived(Math.min(width, 560))
  const titleSize = $derived(compact ? Math.max(36, Math.min(48, width * 0.11)) : Math.min(80, width * 0.072))

  let labelHeight = $state(0)
  let titleHeight = $state(0)
  let introHeight = $state(0)
  let numberWidths = $state(SHOWCASE.projects.map(() => 0))
  let nameWidths = $state(SHOWCASE.projects.map(() => 0))

  const titleY = $derived(-(labelHeight + LABEL_GAP))
  const introY = $derived(titleY - titleHeight - TITLE_GAP)
  const listTop = $derived(introY - introHeight - LIST_GAP)

  $effect(() => {
    if (labelHeight && titleHeight && introHeight) onmeasure(-listTop + SHOWCASE.projects.length * ROW)
  })

  /** Borde izquierdo del par número + nombre, centrado en la columna. */
  const rowStart = (i: number) => cx - ((numberWidths[i] ?? 0) + NUMBER_GAP + (nameWidths[i] ?? 0)) / 2
</script>

<MeasuredText
  text={SHOWCASE.section.label.toUpperCase()}
  fontSize={13}
  color={PALETTE.brandInk}
  font={FONT.bold}
  letterSpacing={1.6}
  lineHeight={1.2}
  alignment="center"
  anchorX={0.5}
  x={cx}
  {opacity}
  onmeasure={(_, h) => (labelHeight = h)}
/>
<InlineHeadline
  text={SHOWCASE.section.title}
  fontSize={titleSize}
  lineHeight={1.04}
  letterSpacing={-titleSize * 0.02}
  maxWidth={compact ? width : Math.min(width, 840)}
  x={cx}
  y={titleY}
  {opacity}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<LeadInText
  text={SHOWCASE.section.intro}
  fontSize={compact ? 17 : 20}
  lineHeight={1.55}
  maxWidth={listWidth}
  alignment="center"
  anchorX={0.5}
  x={cx}
  y={introY}
  {opacity}
  onmeasure={(_, h) => (introHeight = h)}
/>

{#each SHOWCASE.projects as project, i (project.id)}
  {@const y = listTop - i * ROW}
  {@const focused = focusedHref === `#${project.id}`}
  <Rect width={listWidth} height={FIGURE.strokeWidth} color={FIGURE.stroke} opacity={FIGURE.strokeOpacity * opacity} x={cx} {y} />
  {#if focused}
    <!-- Anillo de foco: un trazo destacado de tinta, sin color. -->
    <Rect width={listWidth + 18} height={ROW - 6} radius={FIGURE.radius} color={FIGURE.accent} opacity={FIGURE.strokeStrongOpacity * opacity} x={cx} y={y - ROW / 2} />
    <Rect width={listWidth + 15} height={ROW - 9} radius={FIGURE.radius - 1.5} color={PALETTE.paper} opacity={opacity} x={cx} y={y - ROW / 2} z={0.0005} />
  {/if}
  <!-- La fila entera es el blanco del click. -->
  <Rect
    width={listWidth}
    height={ROW}
    color={PALETTE.black}
    opacity={0}
    x={cx}
    y={y - ROW / 2}
    cursor="pointer"
    onclick={() => onselect(i)}
  />
  <MeasuredText
    text={String(i + 1).padStart(2, '0')}
    fontSize={13}
    color={PALETTE.brandInk}
    font={FONT.bold}
    letterSpacing={1.2}
    lineHeight={1.2}
    anchorY={0.5}
    x={rowStart(i)}
    y={y - ROW / 2}
    z={0.001}
    opacity={nameWidths[i] ? opacity : 0}
    onmeasure={(w) => (numberWidths[i] = w)}
  />
  <MeasuredText
    text={project.name}
    fontSize={compact ? 18 : 21}
    color={PALETTE.ink}
    font={FONT.bold}
    lineHeight={1.2}
    anchorY={0.5}
    maxWidth={listWidth - 48}
    x={rowStart(i) + (numberWidths[i] ?? 0) + NUMBER_GAP}
    y={y - ROW / 2}
    z={0.001}
    opacity={numberWidths[i] ? opacity : 0}
    onmeasure={(w) => (nameWidths[i] = w)}
  />
{/each}
{#if SHOWCASE.projects.length > 0}
  <Rect
    width={listWidth}
    height={FIGURE.strokeWidth}
    color={FIGURE.stroke}
    opacity={FIGURE.strokeOpacity * opacity}
    x={cx}
    y={listTop - SHOWCASE.projects.length * ROW}
  />
{/if}
