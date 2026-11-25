<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { HOW_WORK } from '$lib/content.js'
  import { FIGURE } from '$lib/tokens.js'
  import { ASPECT } from './figures/how-work.js'
  import InlineHeadline from './inline-headline.svelte'
  import LeadInText from './lead-in-text.svelte'
  import SectionHead from './section-head.svelte'
  import StepFigure from './step-figure.svelte'

  /**
   * Cómo trabajamos: las etapas una debajo de la otra, centradas (DESIGN.md
   * §6). La escena es más alta que la ventana y se scrollea de corrido (scroll
   * interno del deck, sin pausas): cada etapa aparece con un fundido a medida
   * que entra en la ventana.
   *
   * Cada etapa es una figura 3D line art (DESIGN.md §4, `figures/how-work.ts`)
   * que lleva el protagonismo, su título y su texto con lead-in, sin número. Un
   * trazo fino en tinta (FIGURE) une una etapa con la siguiente.
   */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    /** Distancia del borde de arriba de la ventana al tope del contenido, en px (crece hacia abajo). */
    top: number
    /** El movimiento continuo está permitido: las figuras se animan mientras se ven. */
    motion: boolean
    onmeasure: (height: number) => void
  }

  let { width, viewportHeight, compact, top, motion, onmeasure }: Props = $props()

  const STEPS = HOW_WORK.steps

  // ── Medidas (múltiplos de 8) ───────────────────────────────────
  const HEAD_GAP = $derived(compact ? 48 : 72)
  /** Separación entre dos etapas; el trazo que las une ocupa el medio. */
  const STAGE_GAP = $derived(compact ? 72 : 96)
  const LINK_MARGIN = 16
  const FIGURE_GAP = $derived(compact ? 24 : 32)
  const TITLE_GAP = 16

  const titleSize = $derived(compact ? 22 : 28)
  const bodySize = $derived(compact ? 17 : 19)

  const cx = $derived(width / 2)
  /** Medida del texto centrado: ~60 caracteres por línea como mucho. */
  const textWidth = $derived(Math.min(width, compact ? 360 : 520))
  /** La figura es lo primero que se lee: ocupa la columna, hasta 640 px. */
  const figureWidth = $derived(Math.min(width, 640))
  const figureHeight = $derived(figureWidth / ASPECT)

  let headHeight = $state(0)
  let titleHeights = $state<number[]>(STEPS.map(() => 0))
  let bodyHeights = $state<number[]>(STEPS.map(() => 0))

  const measured = $derived(
    headHeight > 0 && [titleHeights, bodyHeights].every((list) => list.every((h) => h > 0)),
  )

  /** Alto de cada etapa: figura, título y texto. */
  const stageHeights = $derived(STEPS.map((_, k) => figureHeight + FIGURE_GAP + titleHeights[k]! + TITLE_GAP + bodyHeights[k]!))
  /** Tope de cada etapa, en px hacia abajo desde el tope del contenido. */
  const stageTops = $derived.by(() => {
    let y = headHeight + HEAD_GAP
    return stageHeights.map((h) => {
      const at = y
      y += h + STAGE_GAP
      return at
    })
  })
  const total = $derived(stageTops[STEPS.length - 1]! + stageHeights[STEPS.length - 1]!)

  $effect(() => {
    if (measured) onmeasure(total)
  })

  // ── Fundido al entrar ──────────────────────────────────────────
  // Una etapa empieza a aparecer cuando su tope cruza el 90 % de la ventana y
  // está entera al subir otro 30 %. Al volver hacia arriba se va igual.
  const REVEAL_FROM = 0.9
  const REVEAL_SPAN = 0.3
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const reveal = (k: number) =>
    measured ? clamp01((viewportHeight * REVEAL_FROM - (top + stageTops[k]!)) / (viewportHeight * REVEAL_SPAN)) : 0
  /** La figura de la etapa está en la ventana (solo entonces se anima). */
  const onScreen = (k: number) => top + stageTops[k]! < viewportHeight && top + stageTops[k]! + figureHeight > 0
</script>

<SectionHead section={HOW_WORK.section} {width} {compact} align="center" onmeasure={(h) => (headHeight = h)} />

{#each STEPS as item, k (item.title)}
  {@const opacity = reveal(k)}
  {@const y0 = -(stageTops[k] ?? 0)}
  {@const titleY = y0 - figureHeight - FIGURE_GAP}

  {#if measured && k > 0}
    <!-- Trazo que une esta etapa con la anterior: aparece con ella. -->
    {@const length = STAGE_GAP - LINK_MARGIN * 2}
    <Rect
      width={FIGURE.strokeWidth}
      height={length}
      radius={0}
      color={FIGURE.stroke}
      opacity={FIGURE.strokeOpacity * opacity}
      x={cx}
      y={y0 + LINK_MARGIN + length / 2}
    />
  {/if}
  {#if measured}
    <StepFigure index={k} width={figureWidth} x={cx} y={y0 - figureHeight / 2} {opacity} playing={motion && onScreen(k)} />
  {/if}
  <InlineHeadline
    text={item.title}
    fontSize={titleSize}
    lineHeight={1.2}
    letterSpacing={-titleSize * 0.01}
    maxWidth={textWidth}
    x={cx}
    y={titleY}
    {opacity}
    onmeasure={(_, h) => (titleHeights[k] = h)}
  />
  <LeadInText
    text={item.body}
    fontSize={bodySize}
    lineHeight={1.55}
    maxWidth={textWidth}
    alignment="center"
    anchorX={0.5}
    x={cx}
    y={titleY - titleHeights[k]! - TITLE_GAP}
    {opacity}
    onmeasure={(_, h) => (bodyHeights[k] = h)}
  />
{/each}
