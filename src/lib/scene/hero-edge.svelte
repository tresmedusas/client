<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { Color, ShaderMaterial, Vector2 } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import fragmentShader from './prism-edge.frag.glsl'
  import vertexShader from './quad.vert.glsl'

  /**
   * Luz y grano del hero, en un quad que cubre toda su ventana (ver
   * `prism-edge.frag.glsl`): arriba, una franja de haces de luz como los del
   * botón, con su color directo sobre el papel; en todo el hero, un grano
   * fino que reacciona a esa luz.
   */
  interface Props {
    /** Centro x de la ventana, en las coordenadas del hero (que van desde la columna, no desde la ventana). */
    x: number
    /** Borde de arriba de la ventana, en las coordenadas del hero. */
    top: number
    /** Alto de la ventana, en px. */
    height: number
    /** Segundos del reloj del hero. */
    time: number
  }

  let { x, top, height, time }: Props = $props()

  /** Alto de la franja de luz: esta fracción del alto de la ventana. */
  const THICKNESS = 0.65

  const { size, invalidate } = useThrelte()
  const width = $derived($size.width)

  const uniforms = {
    u_box: { value: new Vector2() },
    u_thickness: { value: 0 },
    u_time: { value: 0 },
    u_ink: { value: new Color(PALETTE.ink) },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  $effect(() => {
    uniforms.u_box.value.set(width, height)
    uniforms.u_thickness.value = Math.round(height * THICKNESS)
    uniforms.u_time.value = time
    invalidate()
  })

  $effect(() => () => material.dispose())
</script>

{#if width > 0 && height > 0}
  <!-- z = −0.5: entre el papel (−1) y el texto del hero (0), que queda encima de la luz y del grano. -->
  <T.Mesh position.x={x} position.y={top - height / 2} position.z={-0.5} scale.x={width} scale.y={height}>
    <T.PlaneGeometry />
    <T is={material} />
  </T.Mesh>
{/if}
