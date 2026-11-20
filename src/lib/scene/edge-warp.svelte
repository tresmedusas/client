<script lang="ts">
  // Bordes de arriba y de abajo: el contenido se dobla, se separa en canales,
  // se difumina y ondula al entrar y salir (ver edge-warp.frag.glsl).
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three'
  import fragmentShader from './edge-warp.frag.glsl'
  import vertexShader from './backdrop.vert.glsl'

  interface Props {
    /** Fase de la ondulación, en radianes: la mueve quien lo usa. */
    phase: number
  }

  let { phase }: Props = $props()

  /**
   * Todo lo que regula el efecto. Valores marcados a propósito, para ver cómo
   * se comporta.
   */
  const LOOK = {
    /** Alto de cada franja (px CSS), y como mucho esta fracción de la ventana. */
    height: 45,
    maxFraction: 0.13,
    /** Ángulo (rad) del cilindro en el borde: más, más se comprime hacia él. Hasta 1.5. */
    curve: 1.3,
    /** Cuánto se abre hacia los costados en el borde: 0.45 = ×1.45. */
    spread: 0.45,
    /** Diferencia de deformación entre canales: el rojo se abre menos y el azul más. */
    aberration: 0.3,
    /** Separación vertical de canales en el borde (px CSS). */
    split: 6,
    /** Radio del blur en el borde (px CSS). */
    blur: 24,
    /** Ondulación líquida pegada al borde: amplitud y largo de onda (px CSS). */
    ripple: 5,
    wavelength: 140,
  }

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
    u_height: { value: LOOK.height },
    u_curve: { value: LOOK.curve },
    u_spread: { value: LOOK.spread },
    u_aberration: { value: LOOK.aberration },
    u_split: { value: LOOK.split },
    u_blur: { value: LOOK.blur },
    u_ripple: { value: LOOK.ripple },
    u_wavelength: { value: LOOK.wavelength },
    u_phase: { value: 0 },
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
    uniforms.u_height.value = Math.min(LOOK.height, vh * LOOK.maxFraction)
    uniforms.u_phase.value = phase
    invalidate()
  })

  $effect(() => () => {
    material.dispose()
    mesh.geometry.dispose()
  })
</script>

<T is={mesh} scale.x={vw} scale.y={vh} position.z={Z} />
