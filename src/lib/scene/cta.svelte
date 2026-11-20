<script lang="ts">
  import { Glass } from 'essentia-crystal'
  import { Rect } from 'essentia-primitives'
  import type { Link } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { CTA_HEIGHT as HEIGHT } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    link: Link
    variant?: 'primary' | 'secondary'
    /** Borde izquierdo. */
    x: number
    /** Borde de arriba. */
    y: number
    /** Tiene el foco en la capa semántica: se dibuja el anillo. */
    focused: boolean
    /** Avisa el ancho del botón cuando el label está medido. */
    onmeasure?: (width: number) => void
    onnavigate: (href: string) => void
  }

  let { link, variant = 'primary', x, y, focused, onmeasure, onnavigate }: Props = $props()

  const PADDING = 26
  const FONT_SIZE = 16

  let labelWidth = $state(0)
  const width = $derived(labelWidth + PADDING * 2)

  $effect(() => {
    if (labelWidth > 0) onmeasure?.(width)
  })

  const primary = $derived(variant === 'primary')
</script>

<!--
  z = 1: el nivel de captura de los vidrios del contenido. El label se mide
  primero (invisible hasta tener ancho) y el vidrio aparece con su tamaño final.
-->
{#if labelWidth > 0}
  {#if focused}
    <!-- Anillo de foco del teclado: un halo de tinta detrás del vidrio, que lo refracta en el canto. -->
    <Rect width={width + 10} height={HEIGHT + 10} radius={(HEIGHT + 10) / 2} color={PALETTE.ink} opacity={0.3} x={x + width / 2} y={y - HEIGHT / 2} z={0.5} />
  {/if}
  <Glass
    preset="pill"
    width={width}
    height={HEIGHT}
    tint={primary ? PALETTE.brand : '#ffffff'}
    tintOpacity={primary ? 0.9 : 0.06}
    brightness={focused ? 0.12 : primary ? 0.06 : 0}
    rim={focused ? 0.9 : primary ? 0.35 : 0.25}
    shadowOpacity={primary ? 0.14 : 0}
    hoverable
    pressable
    cursor="pointer"
    x={x + width / 2}
    y={y - HEIGHT / 2}
    z={1}
    onclick={() => onnavigate(link.href)}
  >
    <MeasuredText
      text={link.label}
      fontSize={FONT_SIZE}
      color={primary ? PALETTE.onBrand : PALETTE.ink}
      font={FONT.bold}
      lineHeight={1.2}
      anchorX={0.5}
      anchorY={0.5}
    />
  </Glass>
{/if}

<!-- Medición: fuera de pantalla hasta que se sabe el ancho. -->
{#if labelWidth === 0}
  <MeasuredText
    text={link.label}
    fontSize={FONT_SIZE}
    color={PALETTE.ink}
    font={FONT.bold}
    lineHeight={1.2}
    x={-100000}
    onmeasure={(w) => (labelWidth = w)}
  />
{/if}
