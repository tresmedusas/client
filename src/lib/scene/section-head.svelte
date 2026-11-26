<script lang="ts">
  import { untrack } from 'svelte'
  import type { Section } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import InlineHeadline from './inline-headline.svelte'
  import LeadInText from './lead-in-text.svelte'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    section: Section
    width: number
    compact: boolean
    /** `display`: el título grande de una escena de apertura o de cierre. @default 'section' */
    size?: 'section' | 'display'
    /** `center`: etiqueta, título e intro centrados en `width` (DESIGN.md §6). @default 'start' */
    align?: 'start' | 'center'
    /** Ancho máximo del título, si tiene que dejar lugar (al botón de volver de la página de un caso). */
    titleMaxWidth?: number
    /** Alto del encabezado (etiqueta, título e intro) cuando está medido. */
    onmeasure: (height: number) => void
    /** El título medido: ancho de su línea más larga, su tope y el alto de una línea. */
    ontitle?: (title: { width: number; top: number; line: number }) => void
  }

  let { section, width, compact, size = 'section', align = 'start', titleMaxWidth = Infinity, onmeasure, ontitle }: Props = $props()

  const LABEL_SIZE = 13
  const LABEL_GAP = 18
  const TITLE_GAP = 20
  const display = $derived(size === 'display')
  const titleSize = $derived(display ? (compact ? Math.max(36, Math.min(48, width * 0.11)) : Math.min(76, width * 0.068)) : compact ? 30 : 46)
  const titleLine = $derived(display ? 1.04 : 1.12)
  const introSize = $derived(compact ? 17 : display ? 21 : 19)
  const centered = $derived(align === 'center')
  const x = $derived(centered ? width / 2 : 0)
  const anchorX = $derived(centered ? 0.5 : 0)
  const alignment = $derived(centered ? 'center' : 'left')

  let labelHeight = $state(untrack(() => (section.label ? 0 : -1)))
  let titleHeight = $state(0)
  let titleWidth = $state(0)
  // Los props no cambian de contenido en esta landing: la ausencia se fija al montar.
  let introHeight = $state(untrack(() => (section.intro ? 0 : -1)))

  /** Sin etiqueta, el título va arriba de todo. */
  const titleY = $derived(labelHeight > 0 ? -(labelHeight + LABEL_GAP) : 0)
  const introY = $derived(titleY - titleHeight - TITLE_GAP)

  $effect(() => {
    if (labelHeight === 0 || titleHeight === 0 || introHeight === 0) return
    onmeasure(introHeight < 0 ? -titleY + titleHeight : -introY + introHeight)
  })

  $effect(() => {
    if (titleHeight > 0) ontitle?.({ width: titleWidth, top: -titleY, line: titleSize * titleLine })
  })
</script>

{#if section.label}
  <MeasuredText
    text={section.label.toUpperCase()}
    fontSize={LABEL_SIZE}
    color={PALETTE.brandInk}
    font={FONT.bold}
    letterSpacing={1.6}
    lineHeight={1.2}
    {x}
    {anchorX}
    {alignment}
    onmeasure={(_, h) => (labelHeight = h)}
  />
{/if}
<!-- Título inline, como el del hero; la intro, con lead-in. -->
<InlineHeadline
  text={section.title}
  fontSize={titleSize}
  lineHeight={titleLine}
  letterSpacing={-titleSize * 0.02}
  maxWidth={Math.min(width, display ? 900 : 780, titleMaxWidth)}
  {x}
  y={titleY}
  alignment={centered ? 'center' : 'left'}
  onmeasure={(w, h) => {
    titleWidth = w
    titleHeight = h
  }}
/>
{#if section.intro}
  <LeadInText
    text={section.intro}
    fontSize={introSize}
    lineHeight={1.55}
    maxWidth={Math.min(width, 640)}
    {x}
    y={introY}
    {anchorX}
    {alignment}
    onmeasure={(_, h) => (introHeight = h)}
  />
{/if}
