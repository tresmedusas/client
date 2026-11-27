<script lang="ts">
  import { T } from '@threlte/core'
  import { ShaderMaterial, Vector2, type IUniform } from 'three'
  import { BEAM_UNIFORMS, FIELD_UNIFORMS, MAX_BEAMS, beamCount, hueRanges, type FieldLook } from './beam-look.js'
  import fragmentShader from './light-beams.frag.glsl'
  import vertexShader from './quad.vert.glsl'

  /**
   * Los haces de luz del botón del hero (`prism-beams.glsl`) en un
   * rectángulo redondeado: deambulan por el rectángulo y se juntan en su
   * bisel. Con `side="top"`, el rectángulo es una franja bajo un borde de
   * arriba: la luz se junta en ese borde y se apaga hacia abajo. Es la pieza
   * reutilizable de los haces (`beam-look.ts`); hoy no la usa ningún
   * componente.
   */
  interface Props {
    width: number
    height: number
    /** Radio de las esquinas, en px. */
    radius: number
    /** Los haces y cómo se ven en el rectángulo. */
    look: FieldLook
    /** Segundos del reloj de los haces: se mueven con él. */
    time: number
    /** Multiplica el brillo de los haces. @default 1 */
    boost?: number
    /** `all`: el bisel es todo el contorno; `top`: solo el borde de arriba. @default 'all' */
    side?: 'all' | 'top'
    /** Centro. */
    x: number
    y: number
    z: number
  }

  let { width, height, radius, look, time, boost = 1, side = 'all', x, y, z }: Props = $props()

  const uniforms: Record<string, IUniform> = {
    u_size: { value: new Vector2() },
    u_radius: { value: 0 },
    u_time: { value: 0 },
    u_boost: { value: 1 },
    u_top: { value: 0 },
    HUES: { value: Array.from({ length: MAX_BEAMS }, () => new Vector2()) },
    ...Object.fromEntries([...Object.values(BEAM_UNIFORMS), ...Object.values(FIELD_UNIFORMS)].map((name) => [name, { value: 0 }])),
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  $effect(() => {
    uniforms.u_size!.value.set(width, height)
    uniforms.u_radius!.value = radius
    uniforms.u_top!.value = side === 'top' ? 1 : 0
  })

  $effect(() => {
    for (const [key, name] of Object.entries(BEAM_UNIFORMS)) uniforms[name]!.value = look[key as keyof typeof BEAM_UNIFORMS]
    for (const [key, name] of Object.entries(FIELD_UNIFORMS)) uniforms[name]!.value = look[key as keyof typeof FIELD_UNIFORMS]
    uniforms.BEAMS!.value = beamCount(look)
    hueRanges(look).forEach(([hue, range], i) => (uniforms.HUES!.value as Vector2[])[i]!.set(hue, range))
  })

  $effect(() => {
    uniforms.u_time!.value = time
    uniforms.u_boost!.value = boost
  })

  $effect(() => () => material.dispose())
</script>

{#if width > 0 && height > 0}
  <T.Mesh position={[x, y, z]} scale.x={width} scale.y={height}>
    <T.PlaneGeometry />
    <T is={material} />
  </T.Mesh>
{/if}
