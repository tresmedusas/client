<script lang="ts">
  // Fondo del sitio: papel blanco liso (ver backdrop.frag.glsl).
  import { T } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Color, ShaderMaterial } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import fragmentShader from './backdrop.frag.glsl'
  import vertexShader from './backdrop.vert.glsl'

  const engine = useEngine()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)

  const uniforms = {
    u_paper: { value: new Color(PALETTE.paper) },
  }
  // Un quad y un draw call; detrás de todo, sin escribir profundidad.
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false })

  $effect(() => () => material.dispose())
</script>

<T.Mesh scale.x={vw} scale.y={vh} position.z={-1}>
  <T.PlaneGeometry />
  <T is={material} />
</T.Mesh>
