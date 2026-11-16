<script lang="ts">
  import { untrack } from 'svelte'
  import type { Section } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    section: Section
    width: number
    compact: boolean
    /** `display`: el título grande de una escena de apertura o de cierre. @default 'section' */
    size?: 'section' | 'display'
    /** Alto del encabezado (etiqueta, título e intro) cuando está medido. */
    onmeasure: (height: number) => void
  }

  let { section, width, compact, size = 'section', onmeasure }: Props = $props()

  const LABEL_SIZE = 13
  const LABEL_GAP = 18
  const TITLE_GAP = 20
  const display = $derived(size === 'display')
  const titleSize = $derived(display ? (compact ? Math.max(36, Math.min(48, width * 0.11)) : Math.min(76, width * 0.068)) : compact ? 30 : 46)
  const introSize = $derived(compact ? 17 : display ? 21 : 19)

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
  text={(section.index ? `${section.index} — ${section.label}` : section.label).toUpperCase()}
  fontSize={LABEL_SIZE}
  color={PALETTE.brandInk}
  font={FONT.bold}
  letterSpacing={1.6}
  lineHeight={1.2}
  onmeasure={(_, h) => (labelHeight = h)}
/>
<MeasuredText
  text={section.title}
  fontSize={titleSize}
  color={PALETTE.ink}
  font={display ? FONT.black : FONT.bold}
  lineHeight={display ? 1.04 : 1.12}
  letterSpacing={-titleSize * 0.02}
  maxWidth={Math.min(width, display ? 900 : 780)}
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
