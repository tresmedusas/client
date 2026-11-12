<script lang="ts">
  import { HERO } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import Cta from './cta.svelte'
  import { CTA_GAP, CTA_HEIGHT, NAV_SPACE } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    width: number
    /** Alto de la ventana: el hero la ocupa entera, salvo que el texto pida más. */
    viewportHeight: number
    compact: boolean
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportHeight, compact, focusedHref, onmeasure, onnavigate }: Props = $props()

  const EYEBROW_SIZE = 14
  const titleSize = $derived(compact ? Math.max(34, Math.min(48, width * 0.105)) : Math.max(48, Math.min(80, width * 0.072)))
  const leadSize = $derived(compact ? 18 : 21)
  /** En escritorio el título deja lugar a las medusas a la derecha (y las toca). */
  const titleWidth = $derived(compact ? width : width * 0.8)

  let eyebrowHeight = $state(0)
  let titleHeight = $state(0)
  let leadHeight = $state(0)
  let primaryWidth = $state(0)
  let secondaryWidth = $state(0)

  /** Los dos botones van en fila si entran; si no, uno abajo del otro. */
  const ctaRow = $derived(primaryWidth + CTA_GAP + secondaryWidth <= width)
  const ctaHeight = $derived(ctaRow ? CTA_HEIGHT : CTA_HEIGHT * 2 + CTA_GAP)

  const titleY = $derived(-(eyebrowHeight + 20))
  const leadY = $derived(titleY - titleHeight - 28)
  const ctaY = $derived(leadY - leadHeight - 40)
  const blockHeight = $derived(-ctaY + ctaHeight)

  const height = $derived(Math.max(viewportHeight, blockHeight + NAV_SPACE * 2 + 40))
  /** El bloque se centra en lo que queda bajo la navbar, un poco más arriba que la mitad. */
  const top = $derived(-(NAV_SPACE + Math.max(24, (height - NAV_SPACE - blockHeight) * 0.42)))

  $effect(() => {
    if (titleHeight > 0) onmeasure(height)
  })
</script>

<MeasuredText
  text={HERO.eyebrow.toUpperCase()}
  fontSize={EYEBROW_SIZE}
  color={PALETTE.accent}
  font={FONT.semibold}
  letterSpacing={1.8}
  lineHeight={1.2}
  y={top}
  onmeasure={(_, h) => (eyebrowHeight = h)}
/>
<MeasuredText
  text={HERO.title}
  fontSize={titleSize}
  color={PALETTE.text}
  font={FONT.bold}
  lineHeight={1.06}
  letterSpacing={-titleSize * 0.025}
  maxWidth={titleWidth}
  y={top + titleY}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<MeasuredText
  text={HERO.lead}
  fontSize={leadSize}
  color={PALETTE.muted}
  lineHeight={1.55}
  maxWidth={compact ? width : Math.min(width * 0.6, 600)}
  y={top + leadY}
  onmeasure={(_, h) => (leadHeight = h)}
/>
{#if leadHeight > 0}
  <Cta
    link={HERO.primary}
    x={0}
    y={top + ctaY}
    focused={focusedHref === HERO.primary.href}
    onmeasure={(w) => (primaryWidth = w)}
    {onnavigate}
  />
  <Cta
    link={HERO.secondary}
    variant="secondary"
    x={ctaRow ? primaryWidth + CTA_GAP : 0}
    y={top + ctaY - (ctaRow ? 0 : CTA_HEIGHT + CTA_GAP)}
    focused={focusedHref === HERO.secondary.href}
    onmeasure={(w) => (secondaryWidth = w)}
    {onnavigate}
  />
{/if}
