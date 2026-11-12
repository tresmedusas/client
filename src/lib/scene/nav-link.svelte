<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { Rect } from 'essentia-primitives'
  import type { Link } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    link: Link
    fontSize?: number
    font?: string
    color?: string
    /** Punto del texto que cae en `x`: 0 = borde izquierdo, 1 = derecho. */
    anchorX?: 0 | 1
    x: number
    /** Centro vertical. */
    y: number
    z: number
    /** Tiene el foco en la capa semántica. */
    focused: boolean
    onmeasure?: (width: number) => void
    onnavigate: (href: string) => void
  }

  let { link, fontSize = 15, font = FONT.semibold, color = PALETTE.text, anchorX = 0, x, y, z, focused, onmeasure, onnavigate }: Props = $props()

  const { onPointerEnter, onPointerLeave } = useCursor()

  let width = $state(0)
  let height = $state(0)
  const left = $derived(anchorX === 1 ? x - width : x)
</script>

{#if focused && width > 0}
  <Rect width={width + 16} height={height + 10} radius={(height + 10) / 2} color={PALETTE.accent} opacity={0.18} x={left + width / 2} {y} z={z - 0.01} />
{/if}
<T.Group onclick={() => onnavigate(link.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <MeasuredText
    text={link.label}
    {fontSize}
    {font}
    {color}
    lineHeight={1.2}
    anchorY={0.5}
    x={left}
    {y}
    {z}
    onmeasure={(w, h) => {
      width = w
      height = h
      onmeasure?.(w)
    }}
  />
</T.Group>
