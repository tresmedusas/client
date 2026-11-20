<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Rect, TextNode } from 'essentia-primitives'
  import { untrack } from 'svelte'
  import { Color, LinearFilter, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2, WebGLRenderTarget } from 'three'
  import { ABOUT, initials, type Person } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import fragmentShader from './holo-card.frag.glsl'
  import vertexShader from './holo-card.vert.glsl'

  /**
   * Card holográfica de un fundador (pedido del usuario, ver DESIGN.md §6):
   * oscura, con la textura de una huella, un holograma que sigue la luz y un
   * tilt 3D hacia el puntero. El contenido va a la izquierda, como en la
   * referencia: la foto a sangre, «Fundador» y la cruz arriba, el nombre y la
   * profesión abajo, y al pie «Conocer a …», que abre su modal.
   *
   * El texto se dibuja una vez en una textura (`content`) y la card entera es
   * un solo quad: así se inclina con perspectiva sin que sus partes se
   * reordenen ni crucen los niveles de captura de los vidrios.
   */
  interface Props {
    person: Person
    /** Número de la card: 1, 2, 3. */
    index: number
    /** Centro de la card, en el espacio de la sección. */
    x: number
    y: number
    width: number
    height: number
    compact: boolean
    /** Tiene el foco del teclado (el link «Conocer a …» de la capa semántica). */
    focused: boolean
    onopen: (id: string) => void
  }

  let { person, index, x, y, width, height, compact, focused, onopen }: Props = $props()

  /** Margen del quad alrededor de la card, para la sombra y el anillo de foco. */
  const MARGIN = 28
  const RADIUS = 20
  /** Borde interior del contenido (alinea «Fundador» con la cruz). */
  const INSET = 23
  /** Inclinación máxima, en radianes (~11°). */
  const MAX_TILT = 0.2
  const PERSPECTIVE = 900

  const { renderer, invalidate } = useThrelte()
  const engine = useEngine()
  const dpr = $derived(engine.viewport.dpr)

  /** Gris sobre la card: el blanco de la marca hacia la superficie oscura. */
  const dim = (k: number) => `#${new Color(PALETTE.white).lerp(new Color(PALETTE.brandDeep), k).getHexString()}`

  // ── Contenido: texto dibujado en una textura ──────────────────
  const contentScene = new Scene()
  const contentCamera = new OrthographicCamera(0, 1, 0, -1, -10, 10)
  const target = new WebGLRenderTarget(1, 1, { depthBuffer: false })
  target.texture.generateMipmaps = false
  target.texture.minFilter = LinearFilter

  const nodes = untrack(() => {
    const cta = ABOUT.card.cta(person.name).toUpperCase()
    const footer = { fontSize: 10.5, font: FONT.bold, letterSpacing: 1.8, lineHeight: 1.2, anchorY: 1, dpr }
    return {
      label: new TextNode({ text: ABOUT.card.label, fontSize: 18, color: PALETTE.white, font: FONT.bold, letterSpacing: -0.2, anchorY: 0.5, dpr }),
      initials: new TextNode({ text: initials(person.name), fontSize: 30, color: PALETTE.white, font: FONT.bold, letterSpacing: 1, anchorX: 0.5, anchorY: 0.5, dpr }),
      name: new TextNode({ text: person.name, fontSize: 26, color: PALETTE.white, font: FONT.regular, lineHeight: 1.15, letterSpacing: -0.3, anchorY: 1, dpr }),
      role: new TextNode({ text: person.role, fontSize: 13, color: dim(0.4), font: FONT.regular, lineHeight: 1.35, anchorY: 1, dpr }),
      cta: new TextNode({ text: cta, color: dim(0.35), ...footer }),
      index: new TextNode({ text: String(index).padStart(3, '0'), color: dim(0.5), anchorX: 1, ...footer }),
    }
  })
  const all = Object.values(nodes)
  for (const node of all) contentScene.add(node.root)
  // Con foto, las iniciales no se dibujan.
  nodes.initials.root.visible = untrack(() => !person.photo)

  const rect: [number, number, number, number] = [0, 0, 0, 0]
  const heightOf = (node: TextNode) => (node.localRect(rect), rect[3] - rect[1])

  /** Ubica el texto (con los altos ya medidos) y lo dibuja en la textura. */
  function paint() {
    if (width <= 0 || height <= 0) return
    const footerY = -(height - INSET)
    const ctaHeight = heightOf(nodes.cta)
    const roleBottom = footerY + ctaHeight + 30
    const nameBottom = roleBottom + heightOf(nodes.role) + 6
    nodes.initials.setFontSize(Math.round(width * 0.28))

    nodes.label.setPosition(INSET, -30, 0)
    nodes.initials.setPosition(width / 2, -height / 2, 0)
    nodes.name.setPosition(INSET, nameBottom, 0)
    nodes.role.setPosition(INSET, roleBottom, 0)
    nodes.cta.setPosition(INSET, footerY, 0)
    nodes.index.setPosition(width - INSET, footerY, 0)

    const previous = renderer.getRenderTarget()
    const clearColor = renderer.getClearColor(new Color())
    const clearAlpha = renderer.getClearAlpha()
    renderer.setRenderTarget(target)
    renderer.setClearColor(clearColor, 0)
    renderer.clear()
    renderer.render(contentScene, contentCamera)
    renderer.setRenderTarget(previous)
    renderer.setClearColor(clearColor, clearAlpha)
    invalidate()
  }

  // Troika maqueta en un worker: cada texto avisa cuando está listo y se
  // vuelve a dibujar todo en el próximo frame (una vez aunque avisen varios).
  let queued = false
  function schedule() {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      paint()
    })
  }
  const offs = all.map((node) => node.onSync(schedule))

  $effect(() => {
    target.setSize(Math.round(width * dpr), Math.round(height * dpr))
    contentCamera.right = width
    contentCamera.bottom = -height
    contentCamera.updateProjectionMatrix()
    for (const node of all) node.setDpr(dpr)
    nodes.name.setMaxWidth(width - INSET * 2)
    nodes.role.setMaxWidth(width - INSET * 2)
    nodes.name.setFontSize(compact ? 24 : 26)
    untrack(schedule)
  })

  // ── La card ───────────────────────────────────────────────────
  const geometry = new PlaneGeometry(1, 1)
  const uniforms = {
    u_quad: { value: new Vector2() },
    u_card: { value: new Vector2() },
    u_radius: { value: RADIUS },
    u_tilt: { value: new Vector2() },
    u_scale: { value: 1 },
    u_perspective: { value: PERSPECTIVE },
    u_base: { value: new Color(PALETTE.ink) },
    u_light: { value: new Color(PALETTE.white) },
    u_ink: { value: new Color(PALETTE.ink) },
    u_pointer: { value: new Vector2(0.5, 0.5) },
    u_hover: { value: 0 },
    u_focus: { value: 0 },
    u_seed: { value: untrack(() => index) * 3.7 },
    u_content: { value: target.texture as Texture },
    u_photo: { value: null as Texture | null },
    u_photoAspect: { value: 1 },
    u_hasPhoto: { value: 0 },
    /** La foto queda al 70 % de su brillo para que el texto se lea. */
    u_dim: { value: 0.3 },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  // La foto: hasta que carga, la huella sola.
  $effect(() => {
    const src = person.photo
    if (!src) return
    let alive = true
    const texture = new TextureLoader().load(src, () => {
      if (!alive) return
      uniforms.u_photo.value = texture
      uniforms.u_photoAspect.value = texture.image.width / texture.image.height
      uniforms.u_hasPhoto.value = 1
      invalidate()
    })
    texture.colorSpace = SRGBColorSpace
    return () => {
      alive = false
      uniforms.u_hasPhoto.value = 0
      texture.dispose()
    }
  })

  $effect(() => {
    uniforms.u_quad.value.set(width + MARGIN * 2, height + MARGIN * 2)
    uniforms.u_card.value.set(width, height)
    uniforms.u_focus.value = focused ? 1 : 0
    invalidate()
  })

  // ── Puntero: tilt, luz y hover, con un resorte suave ─────────
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let hovering = $state(false)
  const aim = { u: 0.5, v: 0.5 }
  const now = { u: 0.5, v: 0.5, hover: 0 }
  let settling = $state(false)

  function point(uv: Vector2 | undefined) {
    if (!uv) return
    aim.u = uv.x
    aim.v = uv.y
    settling = true
  }

  useTask(
    (delta) => {
      const k = 1 - Math.exp(-delta * 9)
      const goal = hovering ? 1 : 0
      const u = hovering ? aim.u : 0.5
      const v = hovering ? aim.v : 0.5
      now.u += (u - now.u) * k
      now.v += (v - now.v) * k
      now.hover += (goal - now.hover) * k
      const tilt = reduced ? 0 : MAX_TILT * now.hover
      uniforms.u_tilt.value.set(-(now.v - 0.5) * 2 * tilt, (now.u - 0.5) * 2 * tilt)
      uniforms.u_scale.value = 1 + (reduced ? 0 : 0.025 * now.hover)
      uniforms.u_pointer.value.set(now.u, now.v)
      uniforms.u_hover.value = now.hover
      if (Math.abs(u - now.u) + Math.abs(v - now.v) + Math.abs(goal - now.hover) < 0.002) settling = false
    },
    { running: () => settling },
  )

  // El pie se enciende con el puntero encima: el texto se vuelve a dibujar.
  $effect(() => {
    nodes.cta.setColor(hovering || focused ? PALETTE.white : dim(0.35))
  })

  $effect(() => () => {
    for (const off of offs) off()
    for (const node of all) node.destroy()
    target.dispose()
    geometry.dispose()
    material.dispose()
  })
</script>

<!-- El quad: centrado en la card, con el margen de la sombra alrededor. -->
<T.Mesh position.x={x} position.y={y} position.z={0} frustumCulled={false}>
  <T is={geometry} />
  <T is={material} />
</T.Mesh>

<!--
  Zona del puntero: el rectángulo de la card sin inclinar (el raycast no
  entiende la perspectiva del shader). Invisible, por detrás.
-->
<Rect
  width={width}
  height={height}
  radius={RADIUS}
  opacity={0}
  x={x}
  y={y}
  z={-0.01}
  cursor="pointer"
  onpointerenter={(e) => {
    hovering = true
    point(e.uv)
  }}
  onpointermove={(e) => point(e.uv)}
  onpointerleave={() => {
    hovering = false
    settling = true
  }}
  onclick={(e) => {
    // Un arrastre del deck que termina sobre la card no la abre.
    if (e.delta > 6) return
    onopen(person.id)
  }}
/>
