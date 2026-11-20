<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { PALETTE } from '$lib/tokens.js'

  /**
   * Indicador de escenas: una marca por escena en el borde derecho de la
   * ventana. La de la escena que se ve se estira y se oscurece; el click
   * lleva a esa escena. La capa semántica no lo necesita: tiene las anclas.
   */
  interface Props {
    count: number
    /** Escena que se ve, con decimales durante la transición. */
    position: number
    /** Centro x de la columna de marcas. */
    x: number
    onselect: (index: number) => void
  }

  let { count, position, x, onselect }: Props = $props()

  const GAP = 22
  const WIDTH = 4
  const HIT = 24

  /** Cuánto está activa la marca `i`: 1 en su escena, 0 a una escena de distancia. */
  const active = (i: number) => Math.max(0, 1 - Math.abs(position - i))
</script>

{#each Array.from({ length: count }, (_, i) => i) as i (i)}
  {@const a = active(i)}
  {@const y = ((count - 1) / 2 - i) * GAP}
  <Rect
    width={WIDTH}
    height={WIDTH + a * 14}
    radius={WIDTH / 2}
    color={PALETTE.ink}
    opacity={0.35 + a * 0.65}
    {x}
    {y}
    z={10.05}
  />
  <!-- Blanco del click, más grande que la marca. -->
  <Rect width={HIT} height={GAP} color={PALETTE.black} opacity={0} {x} {y} z={10.04} cursor="pointer" onclick={() => onselect(i)} />
{/each}
