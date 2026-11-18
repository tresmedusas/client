<script lang="ts">
  import { Image, Rect } from 'essentia-primitives'
  import { initials, type Person } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  /** Retrato redondo: la foto si la hay; si no, las iniciales sobre el brand profundo. */
  interface Props {
    person: Person
    size: number
    /** Borde izquierdo y de arriba. */
    x: number
    y: number
    z?: number
  }

  let { person, size, x, y, z = 0 }: Props = $props()
</script>

{#if person.photo}
  <Image src={person.photo} width={size} height={size} radius={size / 2} x={x + size / 2} y={y - size / 2} {z} />
{:else}
  <Rect width={size} height={size} radius={size / 2} color={PALETTE.brandDeep} x={x + size / 2} y={y - size / 2} {z} />
  <MeasuredText
    text={initials(person.name)}
    fontSize={Math.round(size * 0.36)}
    color={PALETTE.white}
    font={FONT.bold}
    lineHeight={1}
    letterSpacing={0.5}
    anchorX={0.5}
    anchorY={0.5}
    x={x + size / 2}
    y={y - size / 2}
    z={z + 0.001}
  />
{/if}
