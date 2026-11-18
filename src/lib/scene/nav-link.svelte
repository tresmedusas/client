<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { Image, Rect } from 'essentia-primitives'
  import type { Link } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    link: Link
    /** SVG del ícono, dibujado en el negro de la marca. */
    icon: string
    /** Versión sólida del ícono, para cuando el item está activo. */
    iconSolid?: string
    /** Cuánto lo envuelve el lente (0..1): mezcla el ícono de línea con el sólido. */
    solid?: number
    iconSize?: number
    /** Ancho mínimo del item: los labels cortos ocupan lo mismo. */
    minWidth?: number
    fontSize?: number
    color?: string
    /** Opacidad del ícono: el activo va entero, los demás apagados. */
    iconOpacity?: number
    /** Centro horizontal del item. */
    x: number
    /** Centro vertical del item (ícono + texto). */
    y: number
    z: number
    /** Alto del área que recibe el click (la barra). */
    hitHeight: number
    /** Tiene el foco en la capa semántica. */
    focused: boolean
    /** Avisa el ancho del item: el mayor entre el mínimo, el ícono y el texto. */
    onmeasure?: (width: number) => void
    onnavigate: (href: string) => void
  }

  let {
    link,
    icon,
    iconSolid,
    solid = 0,
    iconSize = 24,
    minWidth = 66,
    fontSize = 11,
    color = PALETTE.ink,
    iconOpacity = 1,
    x,
    y,
    z,
    hitHeight,
    focused,
    onmeasure,
    onnavigate,
  }: Props = $props()

  const { onPointerEnter, onPointerLeave } = useCursor()

  /** Aire entre el ícono y el texto. */
  const GAP = 4
  let textWidth = $state(0)
  let textHeight = $state(0)
  const width = $derived(Math.max(minWidth, iconSize, textWidth))
  const blockHeight = $derived(iconSize + GAP + textHeight)
  const iconY = $derived(y + blockHeight / 2 - iconSize / 2)
  const textTop = $derived(iconY - iconSize / 2 - GAP)
</script>

{#if focused && textWidth > 0}
  <Rect width={width + 18} height={blockHeight + 12} radius={12} color={PALETTE.brand} opacity={0.22} {x} {y} z={z - 0.01} />
{/if}
<T.Group onclick={() => onnavigate(link.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <!-- Área de click: el item entero, no solo los trazos del ícono y las letras. -->
  <Rect width={width + 16} height={hitHeight} color={PALETTE.ink} opacity={0} {x} {y} z={z - 0.02} />
  <!-- Los dos íconos quedan montados: al activarse, el sólido ya está cargado y no parpadea. -->
  <Image src={icon} width={iconSize} height={iconSize} opacity={iconOpacity * (iconSolid ? 1 - solid : 1)} {x} y={iconY} {z} />
  {#if iconSolid}
    <Image src={iconSolid} width={iconSize} height={iconSize} opacity={iconOpacity * solid} {x} y={iconY} {z} />
  {/if}
  <MeasuredText
    text={link.label}
    {fontSize}
    font={FONT.bold}
    {color}
    lineHeight={1.2}
    anchorX={0.5}
    anchorY={0}
    {x}
    y={textTop}
    {z}
    onmeasure={(w, h) => {
      textWidth = w
      textHeight = h
      onmeasure?.(Math.max(minWidth, iconSize, w))
    }}
  />
</T.Group>
