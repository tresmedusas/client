<script lang="ts">
  // Navbar de burbujas: sin barra. Cada link es una gota de vidrio con su
  // ícono; la del activo se ensancha en una pastilla que muestra el texto. El
  // logo es otra gota más, que aparece al dejar el hero. Con el puntero encima,
  // la gota se hincha en su lugar y se corre un poco hacia él, sin mover a las
  // vecinas.
  import { T, useTask } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { prefersReducedMotion } from 'svelte/motion'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import { FONT, LOGO, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'
  import { NAV_GLASS, NAV_MARGIN, clamp01, lerp, navIcon, navLinks, osc, scenePointer, smoothstep, snap, still, stepOsc, type Osc } from './nav-parts.js'

  interface Props {
    width: number
    compact: boolean
    logo?: number
    focusedHref: string | null
    activeHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, compact, logo = 1, focusedHref, activeHref, onnavigate }: Props = $props()

  const engine = useEngine()
  const { onPointerEnter, onPointerLeave } = useCursor()

  /** Diámetro de una gota, aire entre gotas y el ícono. */
  const DROP = 52
  const GAP = 10
  const ICON = 24
  /** Pastilla del activo: aire a los lados y entre el ícono y el texto. */
  const PAD = 18
  const ICON_GAP = 8
  const FONT_SIZE = 13
  const LOGO_HEIGHT = 26
  /** Cuánto se hincha la gota con el puntero encima (cabe en el aire entre gotas). */
  const SWELL = 0.08
  /** Cuánto se corre la gota hacia el puntero, en px. */
  const PULL = 3

  const links = $derived(navLinks(compact))

  // ── Activo ─────────────────────────────────────────────────────
  // Lo marca el scroll (`activeHref`), salvo recién después de un click: el deck
  // pasa por las escenas del medio y la gota que se abre tiene que ser la
  // elegida, no cada una por la que pasa. El click manda hasta que el deck
  // llega, hasta que el usuario mueve el scroll él mismo o, por las dudas, 2 s.
  const CHOSEN_TIMEOUT = 2000
  let chosen = $state<string | null>(null)
  const active = $derived(chosen ?? activeHref)

  $effect(() => {
    if (chosen === null) return
    if (activeHref === chosen) {
      chosen = null
      return
    }
    const timer = setTimeout(() => (chosen = null), CHOSEN_TIMEOUT)
    const release = () => (chosen = null)
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('keydown', release)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('wheel', release)
      window.removeEventListener('keydown', release)
    }
  })

  function choose(href: string) {
    chosen = href === '/' ? null : href
    onnavigate(href)
  }
  let labelWidths = $state<Record<string, number>>({})
  const measured = $derived(links.every((l) => labelWidths[l.href] !== undefined))

  // Por gota: cuánto se abrió en pastilla (activo), cuánto se hinchó (hover) y
  // hacia dónde se corrió (−1 izquierda, 1 derecha).
  const grows = new Map<string, Osc>()
  const lifts = new Map<string, Osc>()
  const pulls = new Map<string, Osc>()
  const logoO = osc(0)
  const growOf = (href: string) => grows.get(href) ?? grows.set(href, osc(href === active ? 1 : 0)).get(href)!
  const liftOf = (href: string) => lifts.get(href) ?? lifts.set(href, osc(0)).get(href)!
  const pullOf = (href: string) => pulls.get(href) ?? pulls.set(href, osc(0)).get(href)!

  /** Lo que se dibuja: se copia de los resortes en cada frame. */
  let frame = $state<{
    grow: Record<string, number>
    lift: Record<string, number>
    pull: Record<string, number>
    wob: Record<string, number>
    logo: number
  }>({
    grow: {},
    lift: {},
    pull: {},
    wob: {},
    logo: 0,
  })
  let phase = $state(0)
  let animating = $state(false)
  let primed = false

  /** Dónde está el puntero (x de la escena), si está a la altura de las gotas. */
  let pointerX = $state<number | null>(null)
  const y = $derived(-engine.viewport.height / 2 + NAV_MARGIN + DROP / 2 + 6)

  $effect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const p = scenePointer(e, engine.viewport)
      pointerX = Math.abs(p.y - y) < DROP / 2 ? p.x : null
    }
    const leave = () => (pointerX = null)
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  })

  const expandedWidth = (href: string) => PAD + ICON + ICON_GAP + (labelWidths[href] ?? 0) + PAD

  /**
   * Ancho y alto de cada gota y dónde va su centro. El hover no entra acá: la
   * gota se hincha sobre su lugar (`s`, `dx`) y la fila no se mueve.
   */
  const layout = $derived.by(() => {
    const l = clamp01(frame.logo)
    const sizes = links.map((link) => {
      const g = frame.grow[link.href] ?? 0
      const s = 1 + SWELL * (frame.lift[link.href] ?? 0)
      const dx = PULL * (frame.pull[link.href] ?? 0)
      return { w: lerp(DROP, expandedWidth(link.href), g), h: DROP, g, s, dx }
    })
    const logoSize = DROP * l
    const total = sizes.reduce((sum, s) => sum + s.w, 0) + GAP * (links.length - 1) + (logoSize + GAP) * l
    let x = -Math.min(total, width) / 2
    const logoX = x + logoSize / 2
    x += (logoSize + GAP) * l
    const drops = sizes.map((s) => {
      const cx = x + s.w / 2
      x += s.w + GAP
      return { ...s, x: cx }
    })
    return { drops, logo: { x: logoX, size: logoSize, scale: l } }
  })

  // Los objetivos: el activo se abre; la gota bajo el puntero se hincha y se
  // corre hacia él.
  const goals = $derived.by(() => {
    const grow: Record<string, number> = {}
    const lift: Record<string, number> = {}
    const pull: Record<string, number> = {}
    links.forEach((link, i) => {
      grow[link.href] = link.href === active ? 1 : 0
      const drop = layout.drops[i]
      const over = pointerX !== null && drop !== undefined && Math.abs(pointerX - drop.x) <= drop.w / 2
      lift[link.href] = over ? 1 : 0
      pull[link.href] = over ? Math.max(-1, Math.min(1, (pointerX! - drop!.x) / (drop!.w / 2))) : 0
    })
    return { grow, lift, pull, logo }
  })

  function sync() {
    const grow: Record<string, number> = {}
    const lift: Record<string, number> = {}
    const pull: Record<string, number> = {}
    const wob: Record<string, number> = {}
    for (const link of links) {
      const g = growOf(link.href)
      grow[link.href] = g.x
      lift[link.href] = liftOf(link.href).x
      pull[link.href] = pullOf(link.href).x
      // Solo ondula al abrirse o cerrarse; el hover es un gesto chico y quieto.
      wob[link.href] = Math.min(0.08, Math.abs(g.v) * 0.035)
    }
    frame = { grow, lift, pull, wob, logo: logoO.x }
  }

  $effect(() => {
    const g = goals
    if (!measured) return
    if (!primed || prefersReducedMotion.current) {
      primed = true
      for (const link of links) {
        snap(growOf(link.href), g.grow[link.href] ?? 0)
        snap(liftOf(link.href), prefersReducedMotion.current ? 0 : (g.lift[link.href] ?? 0))
        snap(pullOf(link.href), prefersReducedMotion.current ? 0 : (g.pull[link.href] ?? 0))
      }
      snap(logoO, g.logo)
      sync()
      if (prefersReducedMotion.current) return
    }
    animating = true
  })

  useTask(
    (delta) => {
      const dt = Math.min(delta, 1 / 20)
      const g = goals
      let done = true
      for (const link of links) {
        const grow = growOf(link.href)
        const lift = liftOf(link.href)
        const pull = pullOf(link.href)
        const gt = g.grow[link.href] ?? 0
        const lt = g.lift[link.href] ?? 0
        const pt = g.pull[link.href] ?? 0
        // Se abre con rebote, se cierra sin.
        stepOsc(grow, gt, gt > grow.x ? 12 : 16, gt > grow.x ? 0.5 : 0.9, dt)
        // El hover: firme, casi sin pasarse, para que no tiemble.
        stepOsc(lift, lt, 18, 0.8, dt)
        stepOsc(pull, pt, 14, 0.9, dt)
        done &&= still(grow, gt, 0.002) && still(lift, lt, 0.002) && still(pull, pt, 0.002)
      }
      stepOsc(logoO, g.logo, 11, 0.45, dt)
      done &&= still(logoO, g.logo, 0.002)
      phase += dt * 2.4
      sync()
      if (done) animating = false
    },
    { running: () => animating },
  )
</script>

{#if measured}
  <!-- La gota del logo: lleva al inicio. -->
  {#if layout.logo.scale > 0.02}
    <Glass {...NAV_GLASS} width={layout.logo.size} height={layout.logo.size} radius={layout.logo.size / 2} x={layout.logo.x} {y} z={10} />
    <T.Group onclick={() => choose('/')} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
      <Rect width={layout.logo.size} height={layout.logo.size} radius={layout.logo.size / 2} color={PALETTE.ink} opacity={0} x={layout.logo.x} {y} z={10.04} />
      <Image
        src={LOGO.isotipoNegro.src}
        width={LOGO_HEIGHT * LOGO.isotipoNegro.aspect * layout.logo.scale}
        height={LOGO_HEIGHT * layout.logo.scale}
        opacity={layout.logo.scale}
        x={layout.logo.x}
        {y}
        z={10.05}
      />
    </T.Group>
    {#if focusedHref === '/'}
      <Rect width={layout.logo.size + 8} height={layout.logo.size + 8} radius={(layout.logo.size + 8) / 2} color={PALETTE.ink} opacity={0.1} x={layout.logo.x} {y} z={10.03} />
    {/if}
  {/if}
{/if}

{#each links as link, i (link.href)}
  {@const drop = layout.drops[i]}
  {#if drop && measured}
    {@const wob = frame.wob[link.href] ?? 0}
    <Glass
      {...NAV_GLASS}
      width={drop.w + drop.h * (drop.s - 1)}
      height={drop.h * drop.s}
      radius={(drop.h * drop.s) / 2}
      x={drop.x + drop.dx}
      {y}
      z={10}
      wobble={wob > 0.002 ? { amplitude: wob, frequency: 0.6, phase: phase + i * 1.3 } : null}
    />
    {#if focusedHref === link.href}
      <Rect width={drop.w + 8} height={drop.h + 8} radius={(drop.h + 8) / 2} color={PALETTE.ink} opacity={0.1} x={drop.x} {y} z={10.03} />
    {/if}
  {/if}
  {#if drop && measured}
    <!--
      Lo único que recibe el click es la gota: el raycast no saltea mallas invisibles,
      y el texto apagado de una gota cerrada cae encima de la vecina.
    -->
    <T.Group onclick={() => choose(link.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
      <Rect width={drop.w} height={drop.h} radius={drop.h / 2} color={PALETTE.ink} opacity={0} x={drop.x} {y} z={10.04} />
    </T.Group>
    {@const iconX = lerp(drop.x, drop.x - drop.w / 2 + PAD + ICON / 2, drop.g) + drop.dx}
    {@const iconSize = ICON * drop.s}
    <Image src={navIcon(link.href)} width={iconSize} height={iconSize} opacity={1 - drop.g} x={iconX} {y} z={10.05} />
    <Image src={navIcon(link.href, true)} width={iconSize} height={iconSize} opacity={drop.g} x={iconX} {y} z={10.05} />
  {/if}
  <!-- El texto se mide siempre (también apagado): la pastilla necesita su ancho. -->
  <MeasuredText
      text={link.label}
      fontSize={FONT_SIZE}
      font={FONT.bold}
      color={PALETTE.ink}
      lineHeight={1.2}
      anchorX={0}
      anchorY={0.5}
      x={drop ? drop.x + drop.dx - drop.w / 2 + PAD + ICON + ICON_GAP : 0}
      {y}
      z={10.05}
      opacity={drop ? smoothstep((drop.g - 0.55) / 0.45) : 0}
      onmeasure={(w) => (labelWidths[link.href] = w)}
    />
{/each}
