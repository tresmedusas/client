<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Color, ShaderMaterial, Vector2, Vector4 } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import fragmentShader from './ocean.frag.glsl'
  import type { MedusaRect } from './layout.js'
  import vertexShader from './ocean.vert.glsl'

  interface Props {
    /** Píxeles CSS que bajó la página. */
    scroll: number
    /** Segundos del reloj de la escena. */
    time: number
    medusas: readonly MedusaRect[]
  }

  let { scroll, time, medusas }: Props = $props()

  const engine = useEngine()
  const { invalidate } = useThrelte()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)

  const uniforms = {
    u_size: { value: new Vector2() },
    u_scroll: { value: 0 },
    u_time: { value: 0 },
    u_surface: { value: new Color(PALETTE.deep) },
    u_abyss: { value: new Color(PALETTE.abyss) },
    u_light: { value: new Color(PALETTE.text) },
    u_glow: { value: [new Color(), new Color(), new Color()] },
    u_haze: { value: new Color(PALETTE.accent) },
    u_medusa: { value: [new Vector4(), new Vector4(), new Vector4()] },
  }
  // Un quad y un draw call; detrás de todo, sin escribir profundidad.
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false })

  $effect(() => {
    uniforms.u_size.value.set(vw, vh)
    uniforms.u_scroll.value = scroll
    uniforms.u_time.value = time
    for (let i = 0; i < 3; i++) {
      const m = medusas[i]
      const slot = uniforms.u_medusa.value[i]!
      // El shader trabaja con el origen abajo a la izquierda.
      if (m) {
        slot.set(m.x + vw / 2, m.y + vh / 2, m.width, m.height)
        uniforms.u_glow.value[i]!.set(m.color)
      } else slot.set(0, 0, 0, 0)
    }
    invalidate()
  })

  $effect(() => () => material.dispose())
</script>

<T.Mesh scale.x={vw} scale.y={vh} position.z={-1}>
  <T.PlaneGeometry />
  <T is={material} />
</T.Mesh>
