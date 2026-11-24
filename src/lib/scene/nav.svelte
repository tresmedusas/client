<script lang="ts">
  // Navbar de burbujas: sin barra. Cada link es una gota de vidrio con su
  // ícono; la del activo se ensancha en una pastilla que muestra el texto. Con el
  // puntero cerca, las gotas crecen como un dock. El logo es otra gota más, que
  // aparece al dejar el hero.
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
  /** Cuánto crece una gota con el puntero encima. */
  const LIFT = 0.16
  /** Alcance del dock: a esta distancia del puntero la gota ya no crece. */
  const REACH = 110

  const links = $derived(navLinks(compact))
  let labelWidths = $state<Record<string, number>>({})
  const measured = $derived(links.every((l) => labelWidths[l.href] !== undefined))

  // Por gota: cuánto se abrió en pastilla (activo) y cuánto creció (dock).
  const grows = new Map<string, Osc>()
  const lifts = new Map<string, Osc>()
  const logoO = osc(0)
  const growOf = (href: string) => grows.get(href) ?? grows.set(href, osc(href === activeHref ? 1 : 0)).get(href)!
  const liftOf = (href: string) => lifts.get(href) ?? lifts.set(href, osc(0)).get(href)!

  /** Lo que se dibuja: se copia de los resortes en cada frame. */
  let frame = $state<{ grow: Record<string, number>; lift: Record<string, number>; wob: Record<string, number>; logo: number }>({
    grow: {},
    lift: {},
    wob: {},
    logo: 0,
  })
  let phase = $state(0)
  let animating = $state(false)
  let primed = false

  /** Dónde está el puntero (x de la escena), si está cerca de la barra. */
  let pointerX = $state<number | null>(null)
  const y = $derived(-engine.viewport.height / 2 + NAV_MARGIN + DROP / 2 + 6)

  $effect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const p = scenePointer(e, engine.viewport)
      pointerX = Math.abs(p.y - y) < DROP ? p.x : null
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

  /** Ancho y alto de cada gota y dónde va su centro. */
  const layout = $derived.by(() => {
    const l = clamp01(frame.logo)
    const sizes = links.map((link) => {
      const g = frame.grow[link.href] ?? 0
      const s = 1 + LIFT * (frame.lift[link.href] ?? 0)
      return { w: lerp(DROP, expandedWidth(link.href), g) * s, h: DROP * s, g }
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

  // Los objetivos: el activo se abre, el dock crece cerca del puntero.
  const goals = $derived.by(() => {
    const grow: Record<string, number> = {}
    const lift: Record<string, number> = {}
    links.forEach((link, i) => {
      grow[link.href] = link.href === activeHref ? 1 : 0
      const cx = layout.drops[i]?.x ?? 0
      lift[link.href] = pointerX === null ? 0 : smoothstep(1 - Math.abs(pointerX - cx) / REACH)
    })
    return { grow, lift, logo }
  })

  function sync() {
    const grow: Record<string, number> = {}
    const lift: Record<string, number> = {}
    const wob: Record<string, number> = {}
    for (const link of links) {
      const g = growOf(link.href)
      const lf = liftOf(link.href)
      grow[link.href] = g.x
      lift[link.href] = lf.x
      wob[link.href] = Math.min(0.08, Math.abs(g.v) * 0.035 + Math.abs(lf.v) * 0.02)
    }
    frame = { grow, lift, wob, logo: logoO.x }
  }

  $effect(() => {
    const g = goals
    if (!measured) return
    if (!primed || prefersReducedMotion.current) {
      primed = true
      for (const link of links) {
        snap(growOf(link.href), g.grow[link.href] ?? 0)
        snap(liftOf(link.href), prefersReducedMotion.current ? 0 : (g.lift[link.href] ?? 0))
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
        const gt = g.grow[link.href] ?? 0
        const lt = g.lift[link.href] ?? 0
        // Se abre con rebote, se cierra sin.
        stepOsc(grow, gt, gt > grow.x ? 12 : 16, gt > grow.x ? 0.5 : 0.9, dt)
        stepOsc(lift, lt, 20, 0.55, dt)
        done &&= still(grow, gt, 0.002) && still(lift, lt, 0.002)
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
    <T.Group onclick={() => onnavigate('/')} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
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
      width={drop.w}
      height={drop.h}
      radius={drop.h / 2}
      x={drop.x}
      {y}
      z={10}
      wobble={wob > 0.002 ? { amplitude: wob, frequency: 0.6, phase: phase + i * 1.3 } : null}
    />
    {#if focusedHref === link.href}
      <Rect width={drop.w + 8} height={drop.h + 8} radius={(drop.h + 8) / 2} color={PALETTE.ink} opacity={0.1} x={drop.x} {y} z={10.03} />
    {/if}
  {/if}
  <T.Group onclick={() => onnavigate(link.href)} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
    {#if drop && measured}
      <Rect width={drop.w} height={drop.h} radius={drop.h / 2} color={PALETTE.ink} opacity={0} x={drop.x} {y} z={10.04} />
      {@const iconX = lerp(drop.x, drop.x - drop.w / 2 + PAD + ICON / 2, drop.g)}
      {@const iconSize = ICON * (drop.h / DROP)}
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
      x={drop ? drop.x - drop.w / 2 + PAD + ICON + ICON_GAP : 0}
      {y}
      z={10.05}
      opacity={drop ? smoothstep((drop.g - 0.55) / 0.45) : 0}
      onmeasure={(w) => (labelWidths[link.href] = w)}
    />
  </T.Group>
{/each}
