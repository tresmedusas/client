<script lang="ts">
  import { T } from '@threlte/core'
  import { HERO } from '$lib/content.js'
  import { FONT } from '$lib/tokens.js'
  import Cta from './cta.svelte'
  import type { SceneFrame } from './deck-logic.js'
  import { LEAD_LINE, NAV_SPACE, SCENE_TOP, TITLE_LINE, heroLayout } from './layout.js'
  import LeadInText from './lead-in-text.svelte'

  /**
   * Hero: quiénes somos y qué hacemos, centrado arriba, con un solo botón. La
   * medusa va debajo (la dibuja el fondo, ver `site-scene.svelte`); las dos
   * posiciones salen de `heroLayout`.
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
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportHeight, compact, d, focusedHref, onmeasure, onnavigate }: Props = $props()

  const layout = $derived(heroLayout(width, viewportHeight, compact, HERO.title))
  const center = $derived(width / 2)
  // Si la bajada no entra en una línea, una medida corta la parte en dos
  // líneas parejas en vez de dejar una palabra sola abajo.
  const leadWidth = $derived(compact ? Math.min(width, layout.leadSize * 18) : width)

  let titleHeight = $state(0)
  let leadHeight = $state(0)
  let ctaWidth = $state(0)

  // La escena ocupa toda la ventana (el slot la deja a `SCENE_TOP` del borde) y el
  // texto baja hasta `textTop`. Mientras no se mide, el alto de una línea.
  const titleY = $derived(-(layout.textTop - SCENE_TOP))
  const leadY = $derived(titleY - (titleHeight || layout.titleSize * TITLE_LINE * HERO.title.split('\n').length) - layout.gaps[0])
  const ctaY = $derived(leadY - (leadHeight || layout.leadSize * LEAD_LINE) - layout.gaps[1])

  $effect(() => {
    if (titleHeight > 0 && leadHeight > 0 && ctaWidth > 0) onmeasure(viewportHeight - SCENE_TOP - NAV_SPACE)
  })

  /** Parallax de salida: lo de abajo se va antes. */
  const lag = (k: number) => d * viewportHeight * k
</script>

<LeadInText
  text={HERO.title}
  fontSize={layout.titleSize}
  font={FONT.black}
  plain="ink"
  lineHeight={TITLE_LINE}
  letterSpacing={-layout.titleSize * 0.02}
  maxWidth={width}
  alignment="center"
  anchorX={0.5}
  x={center}
  y={titleY + lag(0.06)}
  onmeasure={(_, h) => (titleHeight = h)}
/>
<LeadInText
  text={HERO.lead}
  fontSize={layout.leadSize}
  lineHeight={LEAD_LINE}
  maxWidth={leadWidth}
  alignment="center"
  anchorX={0.5}
  x={center}
  y={leadY + lag(0.14)}
  onmeasure={(_, h) => (leadHeight = h)}
/>
<T.Group position.y={lag(0.22)}>
  <Cta
    link={HERO.primary}
    x={center - ctaWidth / 2}
    y={ctaY}
    focused={focusedHref === HERO.primary.href}
    onmeasure={(w) => (ctaWidth = w)}
    {onnavigate}
  />
</T.Group>

