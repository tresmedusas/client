<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { PALETTE } from '$lib/tokens.js'

  /**
   * Indicador de escenas: una marca por escena en el borde derecho de la
   * ventana. Cada marca es un punto redondo; la de la escena que se ve se
   * estira en una píldora y se oscurece (los extremos siempre redondos). El
   * click lleva a esa escena. La capa semántica no lo necesita: tiene las
   * anclas.
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
  /** Ancho de la marca: lo bastante para que sus extremos se lean redondos. */
  const WIDTH = 6
  /** Cuánto se estira la marca activa. */
  const STRETCH = 18
  const HIT = 24

  /** Cuánto está activa la marca `i`: 1 en su escena, 0 a una escena de distancia. */
  const active = (i: number) => Math.max(0, 1 - Math.abs(position - i))
</script>

{#each Array.from({ length: count }, (_, i) => i) as i (i)}
  {@const a = active(i)}
  {@const y = ((count - 1) / 2 - i) * GAP}
  <Rect
    width={WIDTH}
    height={WIDTH + a * STRETCH}
    radius={WIDTH / 2}
    softness={0.4}
    color={PALETTE.ink}
    opacity={0.35 + a * 0.65}
    {x}
    {y}
    z={10.05}
  />
  <!-- Blanco del click, más grande que la marca. -->
  <Rect width={HIT} height={GAP} color={PALETTE.black} opacity={0} {x} {y} z={10.04} cursor="pointer" onclick={() => onselect(i)} />
{/each}
