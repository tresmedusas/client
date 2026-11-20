<script lang="ts">
  import { T } from '@threlte/core'
  import { HERO } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import CtaGroup from './cta-group.svelte'
  import type { SceneFrame } from './deck-logic.js'
  import { NAV_SPACE } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  /** Hero provisorio (se trabaja aparte): eyebrow, título, bajada y botones. */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    /** Corrimiento de la escena (0 = en pantalla). */
    d: number
    frame: SceneFrame
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportHeight, compact, d, frame, focusedHref, onmeasure, onnavigate }: Props = $props()

  const EYEBROW_SIZE = 14
  const titleSize = $derived(compact ? Math.max(34, Math.min(48, width * 0.105)) : Math.max(48, Math.min(84, width * 0.075)))
  const leadSize = $derived(compact ? 18 : 21)
  /** En escritorio el título deja lugar a las medusas a la derecha (y las toca). */
  const titleWidth = $derived(compact ? width : width * 0.8)

  let eyebrowHeight = $state(0)
  let titleHeight = $state(0)
  let leadHeight = $state(0)
  let ctaHeight = $state(0)

  const titleY = $derived(-(eyebrowHeight + 20))
  const leadY = $derived(titleY - titleHeight - 28)
  const ctaY = $derived(leadY - leadHeight - 40)

  $effect(() => {
    if (titleHeight > 0 && leadHeight > 0 && ctaHeight > 0) onmeasure(-ctaY + ctaHeight)
  })

  /** Parallax de salida: lo de abajo se va antes. */
  const lag = (k: number) => d * viewportHeight * k
</script>

<MeasuredText
  text={HERO.eyebrow.toUpperCase()}
  fontSize={EYEBROW_SIZE}
  color={PALETTE.brandInk}
  font={FONT.bold}
  letterSpacing={1.8}
  lineHeight={1.2}
  onmeasure={(_, h) => (eyebrowHeight = h)}
/>
<MeasuredText
  text={HERO.title}
  fontSize={titleSize}
  color={PALETTE.ink}
  font={FONT.black}
  lineHeight={1.04}
  letterSpacing={-titleSize * 0.025}
  maxWidth={titleWidth}
  y={titleY + lag(0.08)}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<MeasuredText
  text={HERO.lead}
  fontSize={leadSize}
  color={PALETTE.muted}
  lineHeight={1.55}
  maxWidth={compact ? width : Math.min(width * 0.6, 600)}
  y={leadY + lag(0.16)}
  onmeasure={(_, h) => (leadHeight = h)}
/>
<T.Group position.y={lag(0.24)}>
  <CtaGroup links={[HERO.primary, HERO.secondary]} {width} y={ctaY} {focusedHref} onmeasure={(h) => (ctaHeight = h)} {onnavigate} />
</T.Group>

<!-- La pista para seguir, abajo de todo, justo encima de la navbar. -->
{#if !compact || viewportHeight > 640}
  <MeasuredText
    text={HERO.hint.toUpperCase()}
    fontSize={12}
    color={PALETTE.muted}
    font={FONT.bold}
    letterSpacing={2}
    lineHeight={1.2}
    anchorX={0.5}
    x={width / 2}
    y={frame.top - viewportHeight + NAV_SPACE + 24 + lag(0.4)}
  />
{/if}
