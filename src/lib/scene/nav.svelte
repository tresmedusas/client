<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { prefersReducedMotion } from 'svelte/motion'
  import { Spring, useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import { NAV } from '$lib/content.js'
  import { LOGO, PALETTE } from '$lib/tokens.js'
  import NavLink from './nav-link.svelte'

  interface Props {
    /** Ancho de la columna: la pastilla nunca lo pasa. */
    width: number
    compact: boolean
    /** Cuánto se ve el logo (0..1): en 0 la pastilla envuelve solo los links. */
    logo?: number
    focusedHref: string | null
    /** Link de la escena que se ve (o de la página): lo envuelve el lente. */
    activeHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, compact, logo = 1, focusedHref, activeHref, onnavigate }: Props = $props()

  const engine = useEngine()
  const { onPointerEnter, onPointerLeave } = useCursor()

  /** Ícono de cada link, por href; el activo usa su versión `-solid`. */
  const ICONS: Record<string, string> = {
    '/#como-trabajamos': 'nav-como-trabajamos',
    '/#nosotros': 'nav-nosotros',
    '/showcase': 'nav-showcase',
    '/#contacto': 'nav-contacto',
  }
  const iconName = (href: string) => ICONS[href] ?? ICONS['/showcase']!

  const HEIGHT = 58
  const MARGIN = 16
  const PADDING = 22
  const LINK_GAP = $derived(compact ? 22 : 30)
  const LOGO_HEIGHT = $derived(compact ? 28 : 30)
  const logoWidth = $derived(LOGO_HEIGHT * LOGO.isotipoNegro.aspect)
  /** El lente del link activo: más ancho que el item y más alto que la barra. */
  const LENS_PAD = 14
  const LENS_OVERHANG = 10
  const LENS_HEIGHT = HEIGHT + LENS_OVERHANG * 2
  const LENS_RADIUS = 36

  /**
   * Vidrio de la barra, tuneado en el playground de crystal: el perfil de
   * `crystal` con un tinte claro casi opaco. Así el lente, que la refracta,
   * no se tiñe.
   */
  const BAR_GLASS = {
    profile: 'dome',
    bevelWidth: 20,
    bevelDepth: 13,
    lip: 4,
    lipSharpness: 8,
    thickness: 30,
    ior: 1.5,
    refraction: 1.15,
    dispersion: 0.15,
    magnify: 0.92,
    blur: 6,
    edgeSharpness: 0,
    tint: '#f0f0f0',
    tintOpacity: 0.4,
    tintMode: 'overlay',
    brightness: 0.2,
    saturation: 0.8,
    reflection: 0.05,
    specular: 0.5,
    rim: 0.01,
    softness: 0,
    shadowOpacity: 0.01,
    shadowSpread: 12,
    shadowOffsetY: 2,
    tilt: 0.5,
    surfaceRoughness: 0,
  } as const

  /** Íconos y textos: todos en el mismo negro; el activo lo marca el lente. */
  const INK = '#1C1C1C'

  /** En un teléfono entran el showcase y el contacto. */
  const links = $derived(compact ? NAV.filter((l) => l.href === '/showcase' || l.href === '/#contacto') : NAV)
  /** Ancho medido de cada item, por href: sobrevive al cambio entre teléfono y escritorio. */
  let itemWidths = $state<Record<string, number>>({})
  const measured = $derived(links.every((l) => itemWidths[l.href] !== undefined))

  const activeIndex = $derived(links.findIndex((l) => l.href === activeHref))
  /** Lo que ocupan los links juntos, con su aire. */
  const linksWidth = $derived(links.reduce((sum, l) => sum + (itemWidths[l.href] ?? 0), 0) + LINK_GAP * (links.length - 1))
  /** Pegada al borde de abajo de la ventana. */
  const y = $derived(-engine.viewport.height / 2 + MARGIN + HEIGHT / 2)

  /** Resorte de segundo orden: `omega` en rad/s, `zeta` < 1 rebota. */
  type Osc = { x: number; v: number }
  function stepOsc(o: Osc, target: number, omega: number, zeta: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt * 240))
    const h = dt / n
    for (let i = 0; i < n; i++) {
      o.v += (omega * omega * (target - o.x) - 2 * zeta * omega * o.v) * h
      o.x += o.v * h
    }
  }
  const still = (o: Osc, target: number, eps = 0.05) => Math.abs(o.x - target) < eps && Math.abs(o.v) < eps * 4
  const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

  // ── Islas ──────────────────────────────────────────────────────
  // El logo va en su propia burbuja de vidrio, a la izquierda de la pastilla de
  // los links. En el hero está escondida en la punta de la pastilla; a medida que
  // el hero se va, se desprende como una gota: sale con un resorte que se pasa,
  // vuelve y ondula (`wobble`) mientras se mueve.

  /** Diámetro de la burbuja del logo y aire hasta la pastilla. */
  const BUBBLE = HEIGHT
  const ISLAND_GAP = 10
  /** La pastilla lleva solo los links. */
  const pillWidth = $derived(Math.min(width - BUBBLE - ISLAND_GAP, PADDING * 2 + linksWidth))

  /** Cuánto salió la burbuja: sigue a `logo` con un resorte que rebota. */
  const drop: Osc = { x: 0, v: 0 }
  let dropVis = $state(0)
  let dropPhase = $state(0)
  let bubbleWobble = $state(0)
  let barWobble = $state(0)
  let dropMoving = $state(false)
  let primed = false

  $effect(() => {
    const target = logo
    if (!measured) return
    if (!primed || prefersReducedMotion.current) {
      // Al cargar (o sin movimiento) arranca en su lugar.
      primed = true
      drop.x = target
      drop.v = 0
      dropVis = target
      return
    }
    dropMoving = true
  })

  useTask(
    (delta) => {
      const dt = Math.min(delta, 1 / 20)
      stepOsc(drop, logo, 11, 0.42, dt)
      dropPhase += dt * 2.2
      dropVis = drop.x
      bubbleWobble = Math.min(0.09, Math.abs(drop.v) * 0.05)
      barWobble = Math.min(0.03, Math.abs(drop.v) * 0.012)
      if (still(drop, logo, 0.002)) {
        bubbleWobble = barWobble = 0
        dropMoving = false
      }
    },
    { running: () => dropMoving },
  )

  /** Dónde va cada cosa: la pastilla, la burbuja con el logo y los items. */
  const layout = $derived.by(() => {
    const d = dropVis
    const s = clamp01(d)
    // El conjunto (burbuja + pastilla) queda centrado; con el rebote se pasa un poco.
    const pillLeft = -((BUBBLE + ISLAND_GAP) * d + pillWidth) / 2 + (BUBBLE + ISLAND_GAP) * d
    const bubbleX = pillLeft + BUBBLE / 2 - (BUBBLE + ISLAND_GAP) * d
    const items: number[] = []
    let x = pillLeft + PADDING
    for (const l of links) {
      const w = itemWidths[l.href] ?? 0
      items.push(x + w / 2)
      x += w + LINK_GAP
    }
    return {
      barX: pillLeft + pillWidth / 2,
      /** Borde izquierdo del logo; se escala desde ahí. */
      logoLeft: bubbleX - (logoWidth / 2) * s,
      logoScale: s,
      items,
      bubble: s > 0.02 ? { x: bubbleX, size: BUBBLE * Math.sqrt(s) } : null,
    }
  })
  const itemX = (i: number) => layout.items[i] ?? 0

  // ── Lente ──────────────────────────────────────────────────────
  // Aparece y se va con un fade: Glass no tiene opacidad, así que el fade lleva
  // cada parámetro visual del lente a su valor neutro, el de un vidrio que no se ve.

  /** Vidrio del lente, tuneado en el playground de crystal: forma fija. */
  const LENS_SHAPE = {
    profile: 'squircle',
    bevelWidth: 16,
    lip: 16,
    lipSharpness: 5,
    thickness: 30,
    ior: 1.37,
    blur: 0,
    edgeSharpness: 0,
    tint: '#121212',
    tintMode: 'overlay',
    softness: 0,
    shadowSpread: 4,
    shadowOffsetY: 2,
    tilt: 0.5,
    surfaceRoughness: 0,
  } as const
  /** …y lo que el fade lleva de neutro (0, o 1 en `magnify`) a estos valores. */
  const LENS_LOOK = {
    bevelDepth: 20,
    refraction: 2.1,
    dispersion: 0.07,
    magnify: 0.92,
    tintOpacity: 0.01,
    brightness: -0.02,
    saturation: 0.8,
    reflection: 0.2,
    specular: 0.07,
    rim: 0.15,
    shadowOpacity: 0.02,
  } as const
  const lensTarget = $derived.by(() => {
    if (activeIndex < 0 || !measured) return null
    return { x: itemX(activeIndex), width: itemWidths[links[activeIndex]!.href]! + LENS_PAD * 2 }
  })

  // ── Lente: gota elástica ───────────────────────────────────────
  // Al cambiar de item, el borde que va adelante corre y el de atrás se queda y
  // después alcanza: el lente se estira, se afina como una gota y ondula.

  /** Borde de adelante y de atrás (rad/s) y su amortiguación. */
  const EDGE_LEAD = 24
  const EDGE_TRAIL = 9
  const EDGE_ZETA = 0.85
  /** Cuánto se afina al estirarse: alto mínimo relativo. */
  const THINNEST = 0.72

  // Bordes del lente (izquierdo y derecho), alto y fade.
  const edgeL: Osc = { x: 0, v: 0 }
  const edgeR: Osc = { x: 0, v: 0 }
  const tall: Osc = { x: LENS_HEIGHT, v: 0 }
  const springFade = new Spring({ stiffness: 14, precision: 0.002 })
  let lensX = $state(0)
  let lensW = $state(0)
  let lensH = $state(LENS_HEIGHT)
  /** 0 = vidrio invisible, 1 = el preset entero. */
  let fade = $state(0)
  let phase = $state(0)
  let speed = $state(0)
  let animating = $state(false)

  $effect(() => {
    const target = lensTarget
    const reduced = prefersReducedMotion.current
    if (target && (springFade.value < 0.01 || reduced)) {
      // Si no se veía, aparece en su lugar en vez de viajar desde el anterior.
      edgeL.x = target.x - target.width / 2
      edgeR.x = target.x + target.width / 2
      edgeL.v = edgeR.v = 0
      tall.x = LENS_HEIGHT
      tall.v = 0
    }
    springFade.target = target ? 1 : 0
    if (reduced) springFade.set(springFade.target)
    sync(0)
    animating = true
  })

  function sync(dvx: number) {
    lensX = (edgeL.x + edgeR.x) / 2
    lensW = edgeR.x - edgeL.x
    lensH = tall.x
    fade = Math.min(1, Math.max(0, springFade.value))
    speed = Math.abs(dvx)
  }

  useTask(
    (delta) => {
      const dt = Math.min(delta, 1 / 20)
      const target = lensTarget
      const before = (edgeL.x + edgeR.x) / 2
      if (target) {
        const right = target.x > before
        stepOsc(edgeR, target.x + target.width / 2, right ? EDGE_LEAD : EDGE_TRAIL, EDGE_ZETA, dt)
        stepOsc(edgeL, target.x - target.width / 2, right ? EDGE_TRAIL : EDGE_LEAD, EDGE_ZETA, dt)
        const thin = Math.pow(target.width / Math.max(1, edgeR.x - edgeL.x), 0.35)
        stepOsc(tall, LENS_HEIGHT * Math.min(1, Math.max(THINNEST, thin)), 30, 1, dt)
      }
      springFade.step(dt)
      phase += dt * (2 + speed / 120)
      sync(((edgeL.x + edgeR.x) / 2 - before) / Math.max(dt, 1e-4))
      const settled =
        springFade.settled &&
        (!target || (still(edgeL, target.x - target.width / 2) && still(edgeR, target.x + target.width / 2) && still(tall, LENS_HEIGHT)))
      if (settled) {
        speed = 0
        animating = false
      }
    },
    { running: () => animating },
  )

  /** Amplitud del blob: crece con lo que se estira y con la velocidad; quieto es liso. */
  const wobbleAmplitude = $derived(Math.min(0.09, Math.max(0, lensW - (lensTarget?.width ?? lensW)) / 1400 + speed / 14000))

  const mix = (from: number, to: number) => from + (to - from) * fade

  /**
   * Cuánto envuelve el lente al item `i` (0..1): el ícono sólido aparece a
   * medida que el lente llega y se apaga cuando se va, no antes.
   */
  function solidness(i: number): number {
    const half = (itemWidths[links[i]!.href] ?? 0) / 2 + LENS_PAD
    if (half <= LENS_PAD) return 0
    return fade * Math.min(1, Math.max(0, 1 - Math.abs(lensX - itemX(i)) / half))
  }

  // La barra no deja pasar el puntero al contenido que se mueve debajo.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()
</script>

<!--
  z = 10: la pastilla de los links y la burbuja del logo, vidrio claro casi opaco
  (`BAR_GLASS`; nivel 2 de captura).
  z = 11: el lente del link activo (`LENS_SHAPE` + `LENS_LOOK`), que refracta la barra y
  lo que pasa por debajo (nivel 3, el último).
  Sin los anchos medidos la pastilla no sabe cuánto mide: aparece con el texto.
-->
{#if measured}
  <Glass {...BAR_GLASS} width={pillWidth} height={HEIGHT} radius={HEIGHT / 2} x={layout.barX} {y}
    z={10}
    wobble={barWobble > 0.002 ? { amplitude: barWobble, frequency: 0.6, phase: dropPhase } : null}
    onclick={stop}
    onpointermove={stop}
  />
  {#if layout.bubble}
    <!-- La burbuja del logo, del mismo vidrio que la barra. -->
    <Glass {...BAR_GLASS} width={layout.bubble.size} height={layout.bubble.size} radius={layout.bubble.size / 2} x={layout.bubble.x} {y}
      z={10}
      wobble={bubbleWobble > 0.002 ? { amplitude: bubbleWobble, frequency: 0.6, phase: dropPhase + 1.7 } : null}
      onclick={(e: { stopPropagation: () => void }) => {
        stop(e)
        onnavigate('/')
      }}
      onpointermove={stop}
    />
  {/if}
{/if}

{#if fade > 0.002}
  <Glass
    {...LENS_SHAPE}
    width={lensW}
    height={lensH}
    radius={Math.min(LENS_RADIUS, lensH / 2)}
    bevelDepth={mix(0, LENS_LOOK.bevelDepth)}
    refraction={mix(0, LENS_LOOK.refraction)}
    dispersion={mix(0, LENS_LOOK.dispersion)}
    magnify={mix(1, LENS_LOOK.magnify)}
    tintOpacity={mix(0, LENS_LOOK.tintOpacity)}
    brightness={mix(0, LENS_LOOK.brightness)}
    saturation={mix(0, LENS_LOOK.saturation)}
    reflection={mix(0, LENS_LOOK.reflection)}
    specular={mix(0, LENS_LOOK.specular)}
    rim={mix(0, LENS_LOOK.rim)}
    shadowOpacity={mix(0, LENS_LOOK.shadowOpacity)}
    wobble={wobbleAmplitude > 0.002 ? { amplitude: wobbleAmplitude, frequency: 0.6, phase } : null}
    x={lensX}
    {y}
    z={11}
    onclick={stop}
    onpointermove={stop}
  />
{/if}

<!--
  El isotipo lleva al inicio; su nombre lo da el link «Tres Medusas» de la capa semántica.
  Viaja con su burbuja: durante el hero se esconde en la punta de la pastilla (`logo` → 0).
-->
{#if layout.logoScale > 0.02}
  {#if focusedHref === '/' && layout.logoScale > 0.5}
    <Rect width={logoWidth + 20} height={LOGO_HEIGHT + 14} radius={(LOGO_HEIGHT + 14) / 2} color={PALETTE.brand} opacity={0.22} x={layout.logoLeft + (logoWidth / 2) * layout.logoScale} {y} z={10.04} />
  {/if}
  <T.Group onclick={() => onnavigate('/')} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
    <T.Group position={[layout.logoLeft, y, 0]} scale={[layout.logoScale, layout.logoScale, 1]}>
      <Image src={LOGO.isotipoNegro.src} width={logoWidth} height={LOGO_HEIGHT} opacity={layout.logoScale} x={logoWidth / 2} y={0} z={10.05} />
    </T.Group>
  </T.Group>
{/if}

{#each links as link, i (link.href)}
  <NavLink
    {link}
    icon={`/icons/${iconName(link.href)}.svg`}
    iconSolid={`/icons/${iconName(link.href)}-solid.svg`}
    solid={solidness(i)}
    color={INK}
    x={itemX(i)}
    {y}
    z={10.05}
    hitHeight={HEIGHT}
    focused={focusedHref === link.href}
    onmeasure={(w) => (itemWidths[link.href] = w)}
    {onnavigate}
  />
{/each}
