<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { Image, Rect } from 'essentia-primitives'
  import { FOOTER } from '$lib/content.js'
  import { LOGO, PALETTE } from '$lib/tokens.js'
  import { footerBands, SCENE_BOTTOM } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  /**
   * Pie de la última escena de cada página: dos franjas a todo el ancho de la
   * ventana, con el contenido en la columna. Arriba, en blanco, el logo
   * centrado; abajo, un punto más gris, «Powered by Essentia» y, del otro
   * lado, el copyright y los términos. La franja de abajo sigue hasta el borde
   * de la ventana.
   *
   * En escritorio la franja de abajo va a los costados (pedido por el usuario,
   * ver DESIGN.md §6); en una columna, apilada y centrada.
   */
  interface Props {
    /** Ancho de la columna. */
    width: number
    viewportWidth: number
    compact: boolean
    /** Tope del pie, en la y de la escena (`footerTop`). */
    y: number
    year: number
    focusedHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, viewportWidth, compact, y, year, focusedHref, onnavigate }: Props = $props()

  const { onPointerEnter, onPointerLeave } = useCursor()

  const bands = $derived(footerBands(compact))
  const LOGO_HEIGHT = $derived(compact ? 28 : 32)
  const logoWidth = $derived(LOGO_HEIGHT * LOGO.completo.aspect)
  const ESSENTIA_HEIGHT = 18
  const essentiaWidth = ESSENTIA_HEIGHT * LOGO.essentia.aspect
  /** Aire entre «Powered by» y el logo de Essentia. */
  const POWERED_GAP = 8
  /** Aire entre el copyright y los términos. */
  const LEGAL_GAP = 24
  const SMALL_SIZE = 13

  let copyrightWidth = $state(0)
  let linkWidth = $state(0)
  let linkHeight = $state(0)
  let poweredWidth = $state(0)

  const mid = $derived(width / 2)
  /** Un punto más ancho que la ventana: en las transiciones del showcase el borde no se asoma. */
  const bleed = $derived(viewportWidth + 4)
  const bottomTop = $derived(y - bands.top)
  /** La franja de abajo, con el margen de abajo de la escena. */
  const bottomHeight = $derived(bands.bottom + SCENE_BOTTOM + 2)

  // Centro vertical de cada fila: en una columna, el copyright y los términos arriba y Essentia abajo.
  const legalY = $derived(compact ? bottomTop - 32 : bottomTop - bands.bottom / 2)
  const poweredY = $derived(compact ? bottomTop - 64 : bottomTop - bands.bottom / 2)

  /** Copyright + términos: a la derecha en escritorio, centrados en una columna. */
  const legalWidth = $derived(copyrightWidth + LEGAL_GAP + linkWidth)
  const legalLeft = $derived(compact ? mid - legalWidth / 2 : width - legalWidth)
  const linkX = $derived(legalLeft + copyrightWidth + LEGAL_GAP + linkWidth / 2)
  /** «Powered by» + logo: a la izquierda en escritorio, centrado en una columna. */
  const poweredLeft = $derived(compact ? mid - (poweredWidth + POWERED_GAP + essentiaWidth) / 2 : 0)
  /**
   * Las letras de «essentia» caen debajo del centro de su caja (la t y el
   * punto de la i suben hasta arriba): se sube la caja para alinearlas con
   * «Powered by».
   */
  const essentiaLift = ESSENTIA_HEIGHT * 0.14

  const focused = $derived(focusedHref === FOOTER.terms.href)
</script>

<!-- Franjas, por detrás del texto (z = 0). El blanco es luz: un borde de tinta al 8 % lo separa del papel. -->
<Rect width={bleed} height={bands.top} color={PALETTE.brand} x={mid} y={y - bands.top / 2} z={-0.03} />
<Rect width={bleed} height={1} color={PALETTE.ink} opacity={0.08} x={mid} y={y - 0.5} z={-0.02} />
<Rect width={bleed} height={bottomHeight} color={PALETTE.brand} x={mid} y={bottomTop - bottomHeight / 2} z={-0.03} />
<Rect width={bleed} height={bottomHeight} color={PALETTE.ink} opacity={0.02} x={mid} y={bottomTop - bottomHeight / 2} z={-0.02} />

<Image src={LOGO.completo.src} width={logoWidth} height={LOGO_HEIGHT} x={mid} y={y - bands.top / 2} />

<MeasuredText
  text={FOOTER.poweredBy}
  fontSize={12}
  color={PALETTE.muted}
  lineHeight={1.2}
  anchorY={0.5}
  x={poweredLeft}
  y={poweredY}
  onmeasure={(w) => (poweredWidth = w)}
/>
<Image
  src={LOGO.essentia.src}
  width={essentiaWidth}
  height={ESSENTIA_HEIGHT}
  x={poweredLeft + poweredWidth + POWERED_GAP + essentiaWidth / 2}
  y={poweredY + essentiaLift}
/>

<MeasuredText
  text={FOOTER.copyright(year)}
  fontSize={SMALL_SIZE}
  color={PALETTE.muted}
  lineHeight={1.2}
  anchorY={0.5}
  x={legalLeft}
  y={legalY}
  onmeasure={(w) => (copyrightWidth = w)}
/>

<!-- Términos: el texto entero recibe el click; el foco del teclado le dibuja un halo. -->
{#if focused && linkWidth > 0}
  <Rect width={linkWidth + 20} height={linkHeight + 14} radius={10} color={PALETTE.ink} opacity={0.08} x={linkX} y={legalY} z={-0.01} />
{/if}
<T.Group onclick={() => onnavigate(FOOTER.terms.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <Rect width={linkWidth + 20} height={linkHeight + 20} color={PALETTE.ink} opacity={0} x={linkX} y={legalY} z={-0.005} />
  <MeasuredText
    text={FOOTER.terms.label}
    fontSize={SMALL_SIZE}
    color={PALETTE.muted}
    lineHeight={1.2}
    anchorX={0.5}
    anchorY={0.5}
    x={linkX}
    y={legalY}
    onmeasure={(w, h) => {
      linkWidth = w
      linkHeight = h
    }}
  />
</T.Group>
