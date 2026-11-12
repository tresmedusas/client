<script lang="ts">
  import { untrack } from 'svelte'
  import type { Section } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    section: Section
    width: number
    compact: boolean
    /** Alto del encabezado (etiqueta, título e intro) cuando está medido. */
    onmeasure: (height: number) => void
  }

  let { section, width, compact, onmeasure }: Props = $props()

  const LABEL_SIZE = 13
  const LABEL_GAP = 18
  const TITLE_GAP = 20
  const titleSize = $derived(compact ? 30 : 44)
  const introSize = $derived(compact ? 17 : 19)

  let labelHeight = $state(0)
  let titleHeight = $state(0)
  // Los props no cambian de contenido en esta landing: la ausencia se fija al montar.
  let introHeight = $state(untrack(() => (section.intro ? 0 : -1)))

  const titleY = $derived(-(labelHeight + LABEL_GAP))
  const introY = $derived(titleY - titleHeight - TITLE_GAP)

  $effect(() => {
    if (labelHeight === 0 || titleHeight === 0 || introHeight === 0) return
    onmeasure(introHeight < 0 ? -titleY + titleHeight : -introY + introHeight)
  })
</script>

<MeasuredText
  text={`${section.index} — ${section.label}`.toUpperCase()}
  fontSize={LABEL_SIZE}
  color={PALETTE.accent}
  font={FONT.semibold}
  letterSpacing={1.6}
  lineHeight={1.2}
  onmeasure={(_, h) => (labelHeight = h)}
/>
<MeasuredText
  text={section.title}
  fontSize={titleSize}
  color={PALETTE.text}
  font={FONT.bold}
  lineHeight={1.12}
  letterSpacing={-titleSize * 0.02}
  maxWidth={Math.min(width, 780)}
  y={titleY}
  onmeasure={(_, h) => (titleHeight = h)}
/>
{#if section.intro}
  <MeasuredText
    text={section.intro}
    fontSize={introSize}
    color={PALETTE.muted}
    lineHeight={1.55}
    maxWidth={Math.min(width, 640)}
    y={introY}
    onmeasure={(_, h) => (introHeight = h)}
  />
{/if}
