<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { HERO } from '$lib/content.js'
  import { FONT, LOGO } from '$lib/tokens.js'
  import type { SceneFrame } from './deck-logic.js'
  import HeroEdge from './hero-edge.svelte'
  import HeroLogo from './hero-logo.svelte'
  import { CTA_HEIGHT, LEAD_LINE, NAV_SPACE, SCENE_TOP, TITLE_LINE, heroLayout } from './layout.js'
  import LeadInText from './lead-in-text.svelte'
  import PrismCta from './prism-cta.svelte'

  /**
   * Hero: el logo animado arriba y, debajo, la marca, qué hacemos y un botón,
   * todo centrado en la columna. Arriba, una franja de haces de luz como los del botón, y en
   * todo el hero un grano que reacciona a esa luz. Las posiciones salen de `heroLayout`.
   */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    /** Corrimiento de la escena (0 = en pantalla). */
    d: number
    /** No se usa: el hero ocupa toda la ventana. */
    frame?: SceneFrame
    focusedHref: string | null
    /** El movimiento continuo (el logo y la luz del botón y de la franja) está permitido. @default true */
    motion?: boolean
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportHeight, compact, d, focusedHref, motion = true, onmeasure, onnavigate }: Props = $props()

  // Reloj del logo y del botón: corre solo con el hero a la vista.
  let time = $state(0)
  useTask((delta) => (time += delta), { running: () => motion && Math.abs(d) < 1 })

  let titleHeight = $state(0)
  let leadHeight = $state(0)
  let ctaWidth = $state(0)

  const measured = $derived(titleHeight > 0 && leadHeight > 0 && ctaWidth > 0)
  const estimate = $derived(heroLayout(width, viewportHeight, compact, HERO.title, LOGO.medusa.aspect))
  const textHeight = $derived(measured ? titleHeight + estimate.gaps[0] + leadHeight + estimate.gaps[1] + CTA_HEIGHT : undefined)
  const layout = $derived(heroLayout(width, viewportHeight, compact, HERO.title, LOGO.medusa.aspect, textHeight))

  // La escena ocupa toda la ventana (el slot la deja a `SCENE_TOP` del borde).
  // Mientras no se mide, el alto de una línea.
  const titleY = $derived(-(layout.textTop - SCENE_TOP))
  const leadY = $derived(titleY - (titleHeight || layout.titleSize * TITLE_LINE) - layout.gaps[0])
  const ctaY = $derived(leadY - (leadHeight || layout.leadSize * LEAD_LINE) - layout.gaps[1])

  $effect(() => {
    if (measured) onmeasure(viewportHeight - SCENE_TOP - NAV_SPACE)
  })

  /** Parallax de salida: lo de abajo se va antes. */
  const lag = (k: number) => d * viewportHeight * k
</script>

<!-- La columna está centrada en la ventana; la escena empieza `SCENE_TOP` debajo de su borde de arriba. -->
<!-- Luz arriba y grano en todo el hero: la ventana, centrada con la columna, desde `SCENE_TOP` hacia abajo. -->
<HeroEdge x={width / 2} top={SCENE_TOP} height={viewportHeight} {time} />
<HeroLogo
  x={layout.logo.x}
  y={-(layout.logo.y - SCENE_TOP) + lag(0.02)}
  width={layout.logo.width}
  height={layout.logo.height}
  {time}
/>
<LeadInText
  text={HERO.title}
  fontSize={layout.titleSize}
  font={FONT.black}
  plain="ink"
  lineHeight={TITLE_LINE}
  letterSpacing={-layout.titleSize * 0.02}
  maxWidth={layout.textWidth}
  alignment="center"
  anchorX={0.5}
  x={width / 2}
  y={titleY + lag(0.06)}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<LeadInText
  text={HERO.lead}
  fontSize={layout.leadSize}
  plain="ink"
  lineHeight={LEAD_LINE}
  maxWidth={layout.textWidth}
  alignment="center"
  anchorX={0.5}
  x={width / 2}
  y={leadY + lag(0.14)}
  onmeasure={(_, h) => (leadHeight = h)}
/>
<T.Group position.y={lag(0.22)}>
  <PrismCta
    link={HERO.primary}
    x={width / 2 - ctaWidth / 2}
    y={ctaY}
    {time}
    focused={focusedHref === HERO.primary.href}
    onmeasure={(w) => (ctaWidth = w)}
    {onnavigate}
  />
</T.Group>
