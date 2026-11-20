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
    focusedHref: string | null
    /** Link de la escena que se ve (o de la página): lo envuelve el lente. */
    activeHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, compact, focusedHref, activeHref, onnavigate }: Props = $props()

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
  /** Aire entre el imagotipo y el primer link. */
  const LOGO_GAP = $derived(compact ? 22 : 34)
  const LOGO_HEIGHT = $derived(compact ? 20 : 22)
  const logoWidth = $derived(LOGO_HEIGHT * LOGO.imagotipo.aspect)
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

  /** La pastilla envuelve el imagotipo y los links, centrada; nunca más ancha que la columna. */
  const linksWidth = $derived(links.reduce((sum, l) => sum + (itemWidths[l.href] ?? 0), 0) + LINK_GAP * (links.length - 1))
  const barWidth = $derived(Math.min(width, PADDING * 2 + logoWidth + LOGO_GAP + linksWidth))
  /** Pegada al borde de abajo de la ventana. */
  const y = $derived(-engine.viewport.height / 2 + MARGIN + HEIGHT / 2)
  const logoX = $derived(-barWidth / 2 + PADDING)

  /** Centro del item `i`: se acomodan de izquierda a derecha, después del imagotipo. */
  function itemCenter(i: number): number {
    let x = logoX + logoWidth + LOGO_GAP
    for (let j = 0; j < i; j++) x += (itemWidths[links[j]!.href] ?? 0) + LINK_GAP
    return x + (itemWidths[links[i]!.href] ?? 0) / 2
  }

  // ── Lente ──────────────────────────────────────────────────────
  // Viaja de un link a otro como una gota: el contorno ondula (`wobble`) en
  // proporción a su velocidad y se estira en la dirección del viaje. Aparece y
  // se va con un fade: Glass no tiene opacidad, así que el fade lleva cada
  // parámetro visual de `LENS_GLASS` a su valor neutro, el de un vidrio que no
  // se ve. Los resortes los avanza una task que corre solo mientras algo se
  // mueve.

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
  const activeIndex = $derived(links.findIndex((l) => l.href === activeHref))
  const lensTarget = $derived.by(() => {
    if (activeIndex < 0 || !measured) return null
    return { x: itemCenter(activeIndex), width: itemWidths[links[activeIndex]!.href]! + LENS_PAD * 2 }
  })

  const springX = new Spring({ stiffness: 15, precision: 0.05 })
  const springW = new Spring({ stiffness: 15, precision: 0.05 })
  const springFade = new Spring({ stiffness: 14, precision: 0.002 })
  let lensX = $state(0)
  let lensW = $state(0)
  /** 0 = vidrio invisible, 1 = el preset entero. */
  let fade = $state(0)
  let phase = $state(0)
  let speed = $state(0)
  let animating = $state(false)

  $effect(() => {
    const target = lensTarget
    const reduced = prefersReducedMotion.current
    if (target) {
      // Si no se veía, aparece en su lugar en vez de viajar desde el anterior.
      if (springFade.value < 0.01 || reduced) {
        springX.set(target.x)
        springW.set(target.width)
      } else {
        springX.target = target.x
        springW.target = target.width
      }
    }
    springFade.target = target ? 1 : 0
    if (reduced) springFade.set(springFade.target)
    sync()
    animating = !(springX.settled && springW.settled && springFade.settled)
  })

  function sync() {
    lensX = springX.value
    lensW = springW.value
    fade = Math.min(1, Math.max(0, springFade.value))
    speed = Math.abs(springX.velocity)
  }

  useTask(
    (delta) => {
      springX.step(delta)
      springW.step(delta)
      springFade.step(delta)
      phase += delta * (2 + speed / 120)
      sync()
      if (springX.settled && springW.settled && springFade.settled) {
        speed = 0
        animating = false
      }
    },
    { running: () => animating },
  )

  /** Amplitud del blob: crece con la velocidad, quieto es liso. */
  const wobbleAmplitude = $derived(Math.min(0.08, speed / 10000))
  /** Se estira en la dirección del viaje. */
  const stretch = $derived(Math.min(18, speed / 60))

  const mix = (from: number, to: number) => from + (to - from) * fade

  /**
   * Cuánto envuelve el lente al item `i` (0..1): el ícono sólido aparece a
   * medida que el lente llega y se apaga cuando se va, no antes.
   */
  function solidness(i: number): number {
    const half = (itemWidths[links[i]!.href] ?? 0) / 2 + LENS_PAD
    if (half <= LENS_PAD) return 0
    return fade * Math.min(1, Math.max(0, 1 - Math.abs(lensX - itemCenter(i)) / half))
  }

  // La barra no deja pasar el puntero al contenido que se mueve debajo.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()
</script>

<!--
  z = 10: la barra, vidrio claro casi opaco (`BAR_GLASS`; nivel 2 de captura).
  z = 11: el lente del link activo (`LENS_SHAPE` + `LENS_LOOK`), que refracta la barra y
  lo que pasa por debajo (nivel 3, el último).
  Sin los anchos medidos la pastilla no sabe cuánto mide: aparece con el texto.
-->
{#if measured}
  <Glass {...BAR_GLASS} width={barWidth} height={HEIGHT} radius={HEIGHT / 2} {y}
    z={10}
    onclick={stop}
    onpointermove={stop}
  />
{/if}

{#if fade > 0.002}
  <Glass
    {...LENS_SHAPE}
    width={lensW + stretch}
    height={LENS_HEIGHT - stretch * 0.3}
    radius={LENS_RADIUS}
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

<!-- El imagotipo lleva al inicio; su nombre lo da el link «Tres Medusas» de la capa semántica. -->
{#if focusedHref === '/'}
  <Rect width={logoWidth + 20} height={LOGO_HEIGHT + 14} radius={(LOGO_HEIGHT + 14) / 2} color={PALETTE.brand} opacity={0.22} x={logoX + logoWidth / 2} {y} z={10.04} />
{/if}
<T.Group onclick={() => onnavigate('/')} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <Image src={LOGO.imagotipo.src} width={logoWidth} height={LOGO_HEIGHT} x={logoX + logoWidth / 2} {y} z={10.05} />
</T.Group>

{#each links as link, i (link.href)}
  <NavLink
    {link}
    icon={`/icons/${iconName(link.href)}.svg`}
    iconSolid={`/icons/${iconName(link.href)}-solid.svg`}
    solid={solidness(i)}
    color={INK}
    x={itemCenter(i)}
    {y}
    z={10.05}
    hitHeight={HEIGHT}
    focused={focusedHref === link.href}
    onmeasure={(w) => (itemWidths[link.href] = w)}
    {onnavigate}
  />
{/each}
