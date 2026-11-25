<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import {
    CircleGeometry,
    Color,
    CustomBlending,
    HalfFloatType,
    Mesh,
    OneFactor,
    OneMinusSrcAlphaFactor,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    Shape as ThreeShape,
    ShapeGeometry,
    ShaderMaterial,
    Vector2,
    Vector3,
    WebGLRenderTarget,
    type BufferGeometry,
  } from 'three'
  import { PALETTE } from '$lib/tokens.js'
  import { Kit, roundedShape } from './figures/kit.js'
  import { ASPECT, DESIGN_WIDTH, HERO_FIGURES, LOOK, type Shape } from './figures/hero.js'

  /**
   * La figura del hero (DESIGN.md §4): la interfaz de lo que nombra el
   * titular, que se pierde en el papel hacia abajo. Cuando el titular cambia
   * «qué construimos», un panel de vidrio cruza el marco: a su izquierda ya
   * está la figura nueva, a su derecha todavía la de antes. Quieta, no se mueve.
   *
   * Cada figura se dibuja una vez en su propio target (plana, vista desde
   * arriba) y entra a la escena como un quad transparente; el panel es un
   * `<Glass>` de Essentia a z 1, que refracta ese quad. Los valores salen de `LOOK`.
   */
  interface Props {
    /** Figura de antes y figura nueva (índices de `HERO_FIGURES`), y cuánto cruzó el panel (0..1). */
    from: number
    to: number
    p: number
    /** Ancho y alto del marco en px CSS. Si es más bajo que el natural (`ASPECT`), la figura se recorta por abajo. */
    width: number
    height: number
    /** Centro del marco. */
    x: number
    y: number
    /** Fundido: 0 no se dibuja. */
    opacity: number
  }

  let { from, to, p, width, height, x, y, opacity }: Props = $props()

  /** El alto natural del marco: la placa se acomoda a él, desde arriba. */
  const natural = $derived(width / ASPECT)
  /** px CSS por px de diseño: el marco y, con `LOOK.scale`, la placa. */
  const zoom = $derived((width / DESIGN_WIDTH) * LOOK.scale)

  const engine = useEngine()
  const { renderer, invalidate } = useThrelte()

  // ── Las figuras, planas ──────────────────────────────────────────
  const kit = new Kit()
  const geometries: BufferGeometry[] = []
  const fills = new Map<number, ReturnType<Kit['face']>>()
  /**
   * El relleno: la tinta sobre el papel con opacidad `a`, mezclada en sRGB
   * como la mezcla el navegador (la capa semántica y el banco de pruebas):
   * así un relleno al 75 % se ve igual de oscuro en los tres.
   */
  const paperInk = [new Color(PALETTE.paper), new Color(PALETTE.ink)].map((c) => c.getRGB(new Color(), 'srgb'))
  const srgbTint = (a: number) => {
    const [p, i] = paperInk as [Color, Color]
    return new Color().setRGB(p.r + (i.r - p.r) * a, p.g + (i.g - p.g) * a, p.b + (i.b - p.b) * a, 'srgb')
  }
  const fillOf = (a: number) => fills.get(a) ?? fills.set(a, kit.face(srgbTint(a))).get(a)!

  /** Una superficie rellena, acostada en el piso a la altura `h`. */
  function surface(geometry: BufferGeometry, fill: number, px: number, pz: number, h: number): Mesh {
    geometries.push(geometry)
    geometry.rotateX(-Math.PI / 2)
    const mesh = new Mesh(geometry, fillOf(fill))
    mesh.position.set(px, h, pz)
    return mesh
  }

  function build(shapes: Shape[]): Scene {
    const scene = new Scene()
    scene.add(kit.dotGrid(250))
    shapes.forEach((s, i) => {
      // Cada forma, un poco más arriba que la anterior: tapa lo que tiene debajo.
      const h = 1 + i
      if (s.kind === 'shadow') {
        const shadow = kit.shadow(s.w, s.h)
        shadow.position.set(s.x, 0.5, s.y)
        scene.add(shadow)
        return
      }
      const stroke = s.strong ? kit.strong : kit.normal
      if (s.kind === 'rect') {
        if (s.fill !== undefined) scene.add(surface(new ShapeGeometry(roundedShape(s.w, s.h, Math.min(s.r, s.w / 2, s.h / 2))), s.fill, s.x, s.y, h))
        if (!s.bare) scene.add(kit.rrect(s.x, s.y, s.w, s.h, s.r, h + 0.5, stroke))
      } else if (s.kind === 'circle') {
        if (s.fill !== undefined) scene.add(surface(new CircleGeometry(s.r, 48), s.fill, s.x, s.y, h))
        if (!s.bare) scene.add(kit.circle(s.x, s.y, s.r, h + 0.5, stroke, 48))
      } else {
        if (s.fill !== undefined && s.closed) {
          // La forma va en el plano xy; acostada, su y pasa a −z.
          const shape = new ThreeShape(s.points.map(([px, py]) => new Vector2(px, -py)))
          scene.add(surface(new ShapeGeometry(shape), s.fill, 0, 0, h))
        }
        if (!s.bare) scene.add(kit.polyline(s.points.map(([px, py]) => new Vector3(px, h + 0.5, py)), stroke, s.closed))
      }
    })
    return scene
  }

  const scenes = HERO_FIGURES.map((f) => build(f.shapes))

  // Vista desde arriba: x a la derecha, z hacia abajo en pantalla.
  const camera = new OrthographicCamera(-1, 1, 1, -1, -3000, 3000)
  camera.up.set(0, 0, -1)

  // Lineal y en media precisión: los grises claros no se escalonan. MSAA para los trazos.
  const targets = scenes.map(() => new WebGLRenderTarget(1, 1, { samples: 4, type: HalfFloatType }))

  // Los targets guardan color lineal premultiplicado: el shader lo pasa a
  // sRGB, elige la figura según de qué lado del panel cae y la funde con `opacity`.
  const material = new ShaderMaterial({
    uniforms: {
      mapFrom: { value: targets[0]!.texture },
      mapTo: { value: targets[0]!.texture },
      split: { value: -1 },
      opacity: { value: 0 },
      size: { value: new Vector2(1, 1) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D mapFrom;
      uniform sampler2D mapTo;
      uniform float split;
      uniform float opacity;
      uniform vec2 size;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * size;
        // A la izquierda del panel, la figura nueva; a la derecha, la de antes.
        vec4 c = mix(texture2D(mapTo, vUv), texture2D(mapFrom, vUv), smoothstep(-1.0, 1.0, p.x - split));
        vec3 rgb = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
        rgb = mix(rgb * 12.92, pow(rgb, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(0.0031308, rgb));
        // Nada se corta en el borde del marco: lo que llega se desvanece en
        // ${LOOK.edgeFade} px; abajo, en un difuminado largo hasta el papel.
        float edge = min(min(p.x, size.x - p.x), size.y - p.y);
        float mask = smoothstep(0.0, ${LOOK.edgeFade.toFixed(1)}, edge);
        mask *= pow(smoothstep(0.0, ${LOOK.bottomFade.toFixed(3)} * size.y, p.y), ${LOOK.bottomCurve.toFixed(3)});
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

  // Las figuras no se mueven: se dibujan una vez, y de nuevo si cambia el tamaño.
  let dirty = $state(true)
  const clearColor = new Color()

  useTask(
    () => {
      const previous = renderer.getRenderTarget()
      const previousAlpha = renderer.getClearAlpha()
      const previousAutoClear = renderer.autoClear
      renderer.getClearColor(clearColor)
      renderer.setClearColor(clearColor, 0)
      renderer.autoClear = true
      scenes.forEach((scene, i) => {
        renderer.setRenderTarget(targets[i]!)
        renderer.render(scene, camera)
      })
      renderer.setRenderTarget(previous)
      renderer.setClearColor(clearColor, previousAlpha)
      renderer.autoClear = previousAutoClear
      dirty = false
    },
    { running: () => opacity > 0 && dirty },
  )

  $effect(() => {
    const dpr = engine.viewport.dpr
    for (const t of targets) t.setSize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)))
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = -height / 2
    // La placa queda donde va en el marco natural, medida desde arriba
    // (`LOOK.offsetY` más abajo del medio): si el marco es más bajo, se recorta abajo.
    const look = (height - natural) / 2 / zoom - LOOK.offsetY
    camera.position.set(0, 1000, look)
    camera.lookAt(0, 0, look)
    camera.updateMatrixWorld()
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    kit.setResolution(width, height)
    material.uniforms.size!.value.set(width, height)
    dirty = true
    invalidate()
  })

  // ── El panel ─────────────────────────────────────────────────────
  /** Ancho del panel, en px de diseño; cruza de afuera de la placa a afuera de la placa. */
  const PANEL = LOOK.panelWidth
  const RANGE = 170 + PANEL
  const moving = $derived(from !== to && p < 1)
  /** Centro del panel respecto del centro del marco, en px CSS. */
  const panelX = $derived((-RANGE + 2 * RANGE * p) * zoom)
  /** El panel aparece y se va desde 0: sin refracción ni brillo, el vidrio no se ve. */
  const panelOn = $derived(moving ? Math.sin(Math.PI * p) * opacity * LOOK.glass : 0)
  /** Centro de la placa respecto del centro del marco, en px CSS (y hacia arriba). */
  const boardY = $derived(height / 2 - natural / 2 - LOOK.offsetY * zoom)

  $effect(() => {
    material.uniforms.mapFrom!.value = targets[from]!.texture
    material.uniforms.mapTo!.value = targets[to]!.texture
    material.uniforms.split!.value = moving ? width / 2 + panelX : -1
    material.uniforms.opacity!.value = opacity
    quad.visible = opacity > 0
    invalidate()
  })

  $effect(() => () => {
    for (const t of targets) t.dispose()
    for (const g of geometries) g.dispose()
    material.dispose()
    quad.geometry.dispose()
    kit.dispose()
  })
</script>

<T is={quad} position.x={x} position.y={y} scale.x={width} scale.y={height} />

{#if panelOn > 0.001}
  <!-- El panel que hace el cambio: un vidrio limpio, alto como la placa, que cruza el marco. -->
  <Glass
    preset="clear"
    width={PANEL * zoom}
    height={150 * zoom}
    radius={14 * zoom}
    magnify={1}
    refraction={panelOn}
    dispersion={0}
    saturation={0}
    specular={0.24 * panelOn}
    rim={0.06 * panelOn}
    shadowOpacity={0}
    x={x + panelX}
    y={y + boardY}
    z={1}
  />
{/if}
