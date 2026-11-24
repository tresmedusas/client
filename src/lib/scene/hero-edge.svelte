<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { Color, ShaderMaterial, Vector2 } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import fragmentShader from './prism-edge.frag.glsl'
  import vertexShader from './quad.vert.glsl'

  /**
   * Luz y grano del hero, en un quad que cubre toda su ventana (ver
   * `prism-edge.frag.glsl`): en los bordes de arriba y de los costados, una
   * franja de haces de luz como los del botón, con su color directo sobre el
   * papel; en todo el hero, un grano fino que reacciona a esa luz.
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
    /** Fondo propio del hero (opaco); sin él, la luz va directo sobre el papel de la página. */
    background?: string
    /** Color del grano. @default PALETTE.ink */
    grain?: string
  }

  let { x, top, height, time, background, grain = PALETTE.ink }: Props = $props()

  /** Grosor de cada franja de luz: esta fracción del lado más corto de la ventana. */
  const THICKNESS = 0.06

  const { size, invalidate } = useThrelte()
  const width = $derived($size.width)

  const uniforms = {
    u_box: { value: new Vector2() },
    u_thickness: { value: 0 },
    u_time: { value: 0 },
    u_ink: { value: new Color(PALETTE.ink) },
    u_paper: { value: new Color(PALETTE.paper) },
    u_opaque: { value: 0 },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  $effect(() => {
    uniforms.u_box.value.set(width, height)
    uniforms.u_thickness.value = Math.round(Math.min(width, height) * THICKNESS)
    uniforms.u_time.value = time
    uniforms.u_ink.value.set(grain)
    uniforms.u_paper.value.set(background ?? PALETTE.paper)
    uniforms.u_opaque.value = background ? 1 : 0
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
