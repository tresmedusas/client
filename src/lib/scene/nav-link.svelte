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
    /** Cuánto lo marca el activo (0..1): mezcla el ícono de línea con el sólido. */
    solid?: number
    iconSize?: number
    /** Ancho mínimo del item: los labels cortos ocupan lo mismo. */
    minWidth?: number
    fontSize?: number
    color?: string
    /** Opacidad del ícono y del texto. */
    opacity?: number
    /**
     * Encima del activo, otra capa (ícono y texto en otro color) en `over.z`:
     * para un indicador oscuro que tapa la capa de abajo. Se ve con `solid`.
     */
    over?: { icon: string; color: string; z: number }
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
    opacity = 1,
    over,
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
  /** Con capa de arriba, la de abajo se apaga a medida que aparece aquella. */
  const base = $derived(over ? opacity * (1 - solid) : opacity)
</script>

{#if focused && textWidth > 0}
  <Rect width={width + 18} height={blockHeight + 12} radius={12} color={PALETTE.brand} opacity={0.22} {x} {y} z={z - 0.01} />
{/if}
<!-- Lo único que recibe el click es el área del item (el raycast no saltea mallas invisibles). -->
<T.Group onclick={() => onnavigate(link.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <Rect width={width + 16} height={hitHeight} color={PALETTE.ink} opacity={0} {x} {y} z={z - 0.02} />
</T.Group>
<!-- Los dos íconos quedan montados: al activarse, el sólido ya está cargado y no parpadea. -->
<Image src={icon} width={iconSize} height={iconSize} opacity={base * (iconSolid && !over ? 1 - solid : 1)} {x} y={iconY} {z} />
{#if iconSolid && !over}
  <Image src={iconSolid} width={iconSize} height={iconSize} opacity={base * solid} {x} y={iconY} {z} />
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
  opacity={base}
  onmeasure={(w, h) => {
    textWidth = w
    textHeight = h
    onmeasure?.(Math.max(minWidth, iconSize, w))
  }}
/>
{#if over && solid > 0.002}
  <Image src={over.icon} width={iconSize} height={iconSize} opacity={opacity * solid} {x} y={iconY} z={over.z} />
  <MeasuredText
    text={link.label}
    {fontSize}
    font={FONT.bold}
    color={over.color}
    lineHeight={1.2}
    anchorX={0.5}
    anchorY={0}
    {x}
    y={textTop}
    z={over.z}
    opacity={opacity * solid}
  />
{/if}
