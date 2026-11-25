<script lang="ts">
  // Bordes de arriba y de abajo: el contenido se dobla (o se estira), se
  // separa en canales, se difumina y ondula al entrar y salir; en el showcase,
  // los bordes izquierdo y derecho reflejan los casos (ver edge-warp.frag.glsl).
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three'
  import fragmentShader from './edge-warp.frag.glsl'
  import vertexShader from './backdrop.vert.glsl'
  import { HOME_WARP, bandHeight, reflectSpan, reflectWidth, type WarpLook } from './edge-warp.js'
  import { isCompact } from './layout.js'

  interface Props {
    /** Fase de la ondulación, en radianes: la mueve quien lo usa. */
    phase: number
    /** Cómo se ve (ver `edge-warp.ts`). @default HOME_WARP */
    look?: WarpLook
    /** Cuánto se enciende el reflejo (0 a 1): según cuán centrado está el caso (ver `reflectFocus`). @default 0 */
    focus?: number
  }

  let { phase, look = HOME_WARP, focus = 0 }: Props = $props()

  /**
   * z: justo por debajo de la navbar (10) y dentro de su nivel de captura
   * (`CAPTURE_LEVEL_EPSILON` = 1e-3): deforma todo el contenido sin sumar un
   * cuarto nivel (Essentia captura hasta 3: contenido, navbar y su lente).
   */
  const Z = 9.9995

  const engine = useEngine()
  const { invalidate } = useThrelte()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)
  const dpr = $derived(engine.viewport.dpr)

  const uniforms = {
    u_background: { value: null as unknown },
    u_resolution: { value: new Vector2(1, 1) },
    u_dpr: { value: 1 },
    u_height: { value: 0 },
    u_curve: { value: 0 },
    u_stretch: { value: 0 },
    u_spread: { value: 0 },
    u_aberration: { value: 0 },
    u_split: { value: 0 },
    u_blur: { value: 0 },
    u_ripple: { value: 0 },
    u_wavelength: { value: 1 },
    u_phase: { value: 0 },
    u_reflect: { value: 0 },
    u_reflectWidth: { value: 0 },
    u_reflectSpan: { value: 0 },
    u_reflectFocus: { value: 0 },
    u_reflectReach: { value: 0 },
    u_reflectBlur: { value: 0 },
    u_reflectWiden: { value: 1 },
    u_reflectSaturation: { value: 0 },
  }
  // Transparente para que se ordene con el resto por z: se dibuja después del
  // contenido y antes de la navbar. Sin profundidad: es una pasada de pantalla.
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
  const mesh = new Mesh(new PlaneGeometry(1, 1), material)

  // Antes de cada draw, la captura del nivel que le toca (se reagrupan en cada frame).
  mesh.onBeforeRender = () => {
    const level = engine.captureFor(mesh.matrixWorld.elements[14]!)
    if (level) uniforms.u_background.value = level.target.texture
  }

  // Un mesh de backdrop: BackgroundCapture lo oculta en la captura de su nivel
  // (no se muestrea a sí mismo) y lo cuenta para armar los niveles.
  $effect(() => {
    engine.backdropMeshes.add(mesh)
    return () => {
      engine.backdropMeshes.delete(mesh)
    }
  })

  $effect(() => {
    uniforms.u_resolution.value.set(vw * dpr, vh * dpr)
    uniforms.u_dpr.value = dpr
    uniforms.u_height.value = bandHeight(look, vh, isCompact(vw))
    uniforms.u_curve.value = look.curve
    uniforms.u_stretch.value = look.stretch
    uniforms.u_spread.value = look.spread
    uniforms.u_aberration.value = look.aberration
    uniforms.u_split.value = look.split
    uniforms.u_blur.value = look.blur
    uniforms.u_ripple.value = look.ripple
    uniforms.u_wavelength.value = look.wavelength
    uniforms.u_reflect.value = look.reflect
    uniforms.u_reflectWidth.value = reflectWidth(look, vw)
    uniforms.u_reflectSpan.value = reflectSpan(look, vh)
    uniforms.u_reflectFocus.value = focus
    uniforms.u_reflectReach.value = look.reflectReach
    uniforms.u_reflectBlur.value = look.reflectBlur
    uniforms.u_reflectWiden.value = look.reflectWiden
    uniforms.u_reflectSaturation.value = look.reflectSaturation
    uniforms.u_phase.value = phase
    invalidate()
  })

  $effect(() => () => {
    material.dispose()
    mesh.geometry.dispose()
  })
</script>

<T is={mesh} scale.x={vw} scale.y={vh} position.z={Z} />
