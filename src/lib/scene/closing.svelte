<script lang="ts">
  import type { Link, Section } from '$lib/content.js'
  import Cta from './cta.svelte'
  import { CTA_GAP, CTA_HEIGHT } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Sección de cierre: encabezado y uno o dos botones. La usan Sites y
   * Contacto.
   */
  interface Props {
    section: Section
    primary?: Link
    secondary?: Link
    width: number
    compact: boolean
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { section, primary, secondary, width, compact, focusedHref, onmeasure, onnavigate }: Props = $props()

  const ACTION_GAP = 32

  let headHeight = $state(0)
  let primaryWidth = $state(0)
  let secondaryWidth = $state(0)

  const ctaY = $derived(-(headHeight + ACTION_GAP))
  const both = $derived(primary !== undefined && secondary !== undefined)
  const ctaRow = $derived(!both || primaryWidth + CTA_GAP + secondaryWidth <= width)
  const ctaHeight = $derived(ctaRow ? CTA_HEIGHT : CTA_HEIGHT * 2 + CTA_GAP)

  $effect(() => {
    if (headHeight > 0) onmeasure(-ctaY + ctaHeight)
  })
</script>

<SectionHead {section} {width} {compact} onmeasure={(h) => (headHeight = h)} />

{#if headHeight > 0}
  {#if primary}
    <Cta link={primary} x={0} y={ctaY} focused={focusedHref === primary.href} onmeasure={(w) => (primaryWidth = w)} {onnavigate} />
  {/if}
  {#if secondary}
    <Cta
      link={secondary}
      variant="secondary"
      x={primary && ctaRow ? primaryWidth + CTA_GAP : 0}
      y={ctaY - (primary && !ctaRow ? CTA_HEIGHT + CTA_GAP : 0)}
      focused={focusedHref === secondary.href}
      onmeasure={(w) => (secondaryWidth = w)}
      {onnavigate}
    />
  {/if}
{/if}
