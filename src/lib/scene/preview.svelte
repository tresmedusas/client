<script lang="ts">
  import { T, useLoader, useThrelte } from '@threlte/core'
  import { UNIT_QUAD } from 'essentia-primitives'
  import { Color, SRGBColorSpace, ShaderMaterial, TextureLoader, Vector2, type Texture } from 'three'
  import vertexShader from './quad.vert.glsl'
  import fragmentShader from './preview.frag.glsl'

  /**
   * Una imagen encajada en un rectángulo redondeado, como `object-fit`: la
   * previsualización de un caso del showcase. `Image` de Essentia estira la
   * imagen al tamaño del quad; acá una captura alta de una landing se ve
   * desde arriba (cover, top) y un logo entra entero sobre su fondo (contain).
   */
  interface Props {
    src: string
    width: number
    height: number
    /** `cover`: llena el marco y recorta; `contain`: entra entera sobre `background`. @default 'cover' */
    fit?: 'cover' | 'contain'
    /** Dónde se ancla lo que se recorta (o lo que sobra). @default 'center' */
    align?: 'top' | 'center'
    /** Fondo detrás de la imagen (y mientras carga). Un color de `PALETTE`. */
    background: string
    /** Margen de una imagen con `contain`, como fracción del lado corto. @default 0.18 */
    padding?: number
    radius?: number
    opacity?: number
    x?: number
    y?: number
    z?: number
  }

  let { src, width, height, fit = 'cover', align = 'center', background, padding = 0.18, radius = 0, opacity = 1, x = 0, y = 0, z = 0 }: Props = $props()

  const { invalidate } = useThrelte()
  const loader = useLoader(TextureLoader)

  const uniforms = {
    u_texture: { value: null as Texture | null },
    u_size: { value: new Vector2(1, 1) },
    u_radius: { value: 0 },
    u_softness: { value: 1 },
    u_opacity: { value: 1 },
    u_imageAspect: { value: 0 },
    u_contain: { value: 0 },
    u_top: { value: 0 },
    u_padding: { value: 0 },
    u_background: { value: new Color() },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  // La textura sale del cache de useLoader (compartida por URL): no se dispone acá.
  $effect(() => {
    const store = loader.load(src, {
      transform: (texture) => {
        texture.colorSpace = SRGBColorSpace
        texture.needsUpdate = true
        return texture
      },
    })
    return store.subscribe((texture) => {
      uniforms.u_texture.value = texture ?? null
      const image = texture?.image as { width?: number; height?: number } | undefined
      uniforms.u_imageAspect.value = image?.width && image.height ? image.width / image.height : 0
      if (texture) invalidate()
    })
  })

  $effect(() => {
    uniforms.u_size.value.set(width, height)
    uniforms.u_radius.value = radius
    uniforms.u_opacity.value = opacity
    uniforms.u_contain.value = fit === 'contain' ? 1 : 0
    uniforms.u_top.value = align === 'top' ? 1 : 0
    uniforms.u_padding.value = padding
    uniforms.u_background.value.set(background)
    invalidate()
  })

  $effect(() => () => material.dispose())
</script>

<T.Mesh position.x={x} position.y={y} position.z={z} scale.x={width} scale.y={height}>
  <T is={UNIT_QUAD} dispose={false} />
  <T is={material} />
</T.Mesh>
