<script lang="ts">
  import { Glass } from 'essentia-crystal'
  import { PALETTE } from '$lib/tokens.js'

  interface Props {
    /** Esquina de arriba a la izquierda, en el espacio de la sección. */
    x: number
    y: number
    width: number
    height: number
    /** Resalta el panel (el reporte de evidencia). */
    accent?: boolean
  }

  let { x, y, width, height, accent = false }: Props = $props()
</script>

<!--
  Vidrio de fondo de una tarjeta. El texto va como hermano a z = 1.01 (por
  delante, fuera de la captura de este nivel), así se mide antes de que el
  vidrio sepa su alto.
-->
{#if width > 0 && height > 0}
  <Glass
    preset="crystal-ui"
    {width}
    {height}
    radius={24}
    tint={accent ? PALETTE.accent : PALETTE.deep}
    tintOpacity={accent ? 0.1 : 0.5}
    tintMode={accent ? 'overlay' : 'dye'}
    blur={10}
    rim={accent ? 0.35 : 0.18}
    shadowOpacity={0}
    x={x + width / 2}
    y={y - height / 2}
    z={1}
  />
{/if}
