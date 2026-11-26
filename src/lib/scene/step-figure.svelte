<script lang="ts">
  import { untrack } from 'svelte'
  import { T, useTask, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import {
    Color,
    CustomBlending,
    Group,
    HalfFloatType,
    Mesh,
    OneFactor,
    OneMinusSrcAlphaFactor,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector3,
    WebGLRenderTarget,
  } from 'three'
  import { CAMERA_DIR, Kit, type KitStyle } from './figures/kit.js'
  import { ASPECT, DESIGN_WIDTH, FIGURES, REST, TARGET_Y } from './figures/how-work.js'

  /**
   * Una figura 3D de HowWork (DESIGN.md §4). Se dibuja en su propio target,
   * con profundidad (las líneas de atrás quedan tapadas), y entra a la escena
   * como un quad transparente: se funde con `opacity` y los vidrios de
   * Essentia la refractan como al resto del contenido.
   *
   * La lupa de la figura 1 es un `<Glass>` de verdad, a z 1 como los demás
   * vidrios del contenido (mismo nivel de captura): magnifica lo que tiene detrás.
   */
  interface Props {
    /** Etapa: 0 a 3. */
    index: number
    /** Ancho del marco en px CSS; el alto sale de `ASPECT`. */
    width: number
    /** Centro del marco. */
    x: number
    y: number
    /** Fundido: 0 no se dibuja. */
    opacity: number
    /** Anima (movimiento permitido y en pantalla). Si no, queda quieta. */
    playing: boolean
    /** Cómo se dibuja (se lee al montar: para cambiarlo, se vuelve a montar). @default {} */
    style?: KitStyle
    /** z del quad. @default 0 */
    z?: number
    /** Fundido de la lente de vidrio, si va distinto que la figura (una hoja que la tapa). @default opacity */
    lensOpacity?: number
  }

  let { index, width, x, y, opacity, playing, style = {}, z = 0, lensOpacity }: Props = $props()
  const glassOpacity = $derived(Math.min(opacity, lensOpacity ?? opacity))

  const height = $derived(width / ASPECT)
  /** Franja del borde del marco en la que la figura se desvanece, en px CSS. */
  const EDGE_FADE = 40
  const zoom = $derived(width / DESIGN_WIDTH)

  const engine = useEngine()
  const { renderer, invalidate } = useThrelte()

  const kit = untrack(() => new Kit(style))
  const figure = untrack(() => FIGURES[index]!(kit))
  const scene = new Scene()
  const pivot = new Group()
  pivot.add(figure.root)
  scene.add(pivot)

  const camera = new OrthographicCamera(-1, 1, 1, -1, -3000, 3000)
  const target = untrack(() => new Vector3(0, TARGET_Y[index], 0))
  camera.position.copy(target).addScaledVector(CAMERA_DIR, 1200)
  camera.lookAt(target)
  camera.updateMatrixWorld()

  // Lineal y en media precisión: los grises claros no se escalonan. MSAA para los trazos.
  const targetRT = new WebGLRenderTarget(1, 1, { samples: 4, type: HalfFloatType })

  // El target guarda color lineal premultiplicado: el shader lo pasa a sRGB
  // (el espacio en que el canvas mezcla) y lo funde con `opacity`.
  const material = new ShaderMaterial({
    uniforms: { map: { value: targetRT.texture }, opacity: { value: 0 }, size: { value: new Vector2(1, 1) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float opacity;
      uniform vec2 size;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        vec3 rgb = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
        rgb = mix(rgb * 12.92, pow(rgb, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(0.0031308, rgb));
        // Nada se corta en el borde del marco: lo que llega se desvanece en ${EDGE_FADE} px.
        vec2 p = vUv * size;
        float edge = min(min(p.x, size.x - p.x), min(p.y, size.y - p.y));
        float mask = smoothstep(0.0, ${EDGE_FADE.toFixed(1)}, edge);
        gl_FragColor = vec4(rgb * c.a, c.a) * opacity * mask;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
  })
  const quad = new Mesh(new PlaneGeometry(1, 1), material)

  // ── Reloj y dibujo ─────────────────────────────────────────────
  let time = untrack(() => REST[index] as number)
  let dirty = $state(true)
  /** Centro de la lente respecto del centro del marco, en px CSS (y hacia arriba). */
  let lensX = $state(0)
  let lensY = $state(0)

  const clearColor = new Color()
  const projected = new Vector3()

  function draw() {
    figure.update(time)
    // Vaivén lento: la figura gira apenas para que se lea el volumen.
    pivot.rotation.y = Math.sin(time * 0.32 + index) * 0.09
    pivot.position.y = Math.sin(time * 0.8 + index) * 3
    scene.updateMatrixWorld()

    const previous = renderer.getRenderTarget()
    const previousAlpha = renderer.getClearAlpha()
    const previousAutoClear = renderer.autoClear
    renderer.getClearColor(clearColor)
    renderer.setClearColor(clearColor, 0)
    renderer.autoClear = true
    renderer.setRenderTarget(targetRT)
    renderer.render(scene, camera)
    renderer.setRenderTarget(previous)
    renderer.setClearColor(clearColor, previousAlpha)
    renderer.autoClear = previousAutoClear

    if (figure.lens) {
      projected.copy(figure.lens.center)
      figure.root.localToWorld(projected).project(camera)
      lensX = (projected.x * width) / 2
      lensY = (projected.y * height) / 2
    }
  }

  // Corre mientras anima, o una vez cuando algo cambió (tamaño, primera vez).
  useTask(
    (delta) => {
      // Tope holgado: con pocos cuadros por segundo la animación no se frena,
      // y al volver de otra pestaña no salta segundos de golpe.
      if (playing) time += Math.min(delta, 0.5)
      draw()
      dirty = false
    },
    { running: () => opacity > 0 && (playing || dirty) },
  )

  $effect(() => {
    const dpr = engine.viewport.dpr
    targetRT.setSize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)))
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = -height / 2
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    kit.setResolution(width, height)
    material.uniforms.size!.value.set(width, height)
    dirty = true
    invalidate()
  })

  $effect(() => {
    material.uniforms.opacity!.value = opacity
    quad.visible = opacity > 0
    invalidate()
  })

  $effect(() => () => {
    targetRT.dispose()
    material.dispose()
    quad.geometry.dispose()
    kit.dispose()
  })

  /** Diámetro del vidrio en pantalla: el del aro, a la escala del marco. */
  const lensSize = $derived(figure.lens ? figure.lens.radius * 2 * zoom : 0)
</script>

<T is={quad} position.x={x} position.y={y} position.z={z} scale.x={width} scale.y={height} />

{#if figure.lens && glassOpacity > 0}
  <!-- Al fundirse, la refracción y el brillo crecen desde 0: sin ellos el vidrio no se ve. -->
  <Glass
    preset="lens"
    width={lensSize}
    height={lensSize}
    radius={lensSize / 2}
    magnify={1 + 0.31 * glassOpacity}
    refraction={glassOpacity}
    dispersion={0.05 * glassOpacity}
    saturation={0}
    specular={0.28 * glassOpacity}
    rim={0.05 * glassOpacity}
    shadowOpacity={0}
    x={x + lensX}
    y={y + lensY}
    z={1}
  />
{/if}
