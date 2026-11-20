<script lang="ts">
  // Fondo del sitio: papel blanco liso (ver backdrop.frag.glsl).
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Color, LinearMipmapLinearFilter, SRGBColorSpace, ShaderMaterial, Texture, Vector2, Vector4 } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import fragmentShader from './backdrop.frag.glsl'
  import { MEDUSA_COUNT, type MedusaRect } from './layout.js'
  import vertexShader from './backdrop.vert.glsl'

  interface Props {
    /** Segundos del reloj de la escena. */
    time: number
    /** Las medusas del hero en pantalla, de atrás hacia adelante; vacío fuera del hero. */
    medusas: readonly MedusaRect[]
  }

  let { time, medusas }: Props = $props()

  /** Dibujo de la medusa y la escala a la que se rasteriza (nítido con DPR 2). */
  const MEDUSA_SRC = '/brand/medusa.svg'
  const MEDUSA_SCALE = 2

  const engine = useEngine()
  const { invalidate } = useThrelte()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)

  const uniforms = {
    u_size: { value: new Vector2() },
    u_time: { value: 0 },
    u_paper: { value: new Color(PALETTE.paper) },
    u_medusaMap: { value: new Texture() },
    u_medusaReady: { value: 0 },
    u_medusa: { value: Array.from({ length: MEDUSA_COUNT }, () => new Vector4()) },
    u_medusaLook: { value: Array.from({ length: MEDUSA_COUNT }, () => new Vector4()) },
  }
  // Un quad y un draw call; detrás de todo, sin escribir profundidad.
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false })

  $effect(() => {
    uniforms.u_size.value.set(vw, vh)
    uniforms.u_time.value = time
    // El shader trabaja con el origen abajo a la izquierda.
    for (let i = 0; i < MEDUSA_COUNT; i++) {
      const m = medusas[i]
      if (m) uniforms.u_medusa.value[i]?.set(m.x + vw / 2, m.y + vh / 2, m.width, m.height)
      else uniforms.u_medusa.value[i]?.set(0, 0, 0, 0)
      uniforms.u_medusaLook.value[i]?.set(m?.phase ?? 0, m?.opacity ?? 0, m?.mirror ? -1 : 1, 0)
    }
    invalidate()
  })

  // El SVG se rasteriza una vez en un canvas: la textura guarda sus grises
  // (en sRGB, el shader los lee en lineal) y la silueta en el alfa.
  $effect(() => {
    const map = uniforms.u_medusaMap.value
    const image = new Image()
    let alive = true
    image.src = MEDUSA_SRC
    image
      .decode()
      .then(() => {
        if (!alive) return
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth * MEDUSA_SCALE
        canvas.height = image.naturalHeight * MEDUSA_SCALE
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
        map.image = canvas
        map.colorSpace = SRGBColorSpace
        map.minFilter = LinearMipmapLinearFilter
        map.needsUpdate = true
        uniforms.u_medusaReady.value = 1
        invalidate()
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  })

  $effect(() => () => {
    material.dispose()
    uniforms.u_medusaMap.value.dispose()
  })
</script>

<T.Mesh scale.x={vw} scale.y={vh} position.z={-1}>
  <T.PlaneGeometry />
  <T is={material} />
</T.Mesh>
