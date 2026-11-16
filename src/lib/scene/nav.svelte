<script lang="ts">
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import { NAV } from '$lib/content.js'
  import { LOGO, PALETTE } from '$lib/tokens.js'
  import NavLink from './nav-link.svelte'

  interface Props {
    /** Ancho de la columna: la barra la acompaña. */
    width: number
    compact: boolean
    focusedHref: string | null
    /** Link de la escena que se ve (o de la página): va en el brand. */
    activeHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, compact, focusedHref, activeHref, onnavigate }: Props = $props()

  const engine = useEngine()
  const { onPointerEnter, onPointerLeave } = useCursor()

  const HEIGHT = 56
  const MARGIN = 16
  const PADDING = 22
  const LINK_GAP = $derived(compact ? 18 : 28)
  const LOGO_HEIGHT = $derived(compact ? 22 : 26)
  const logoWidth = $derived(LOGO_HEIGHT * LOGO.imagotipo.aspect)

  /** En un teléfono entran el showcase y el contacto. */
  const links = $derived(compact ? NAV.filter((l) => l.href === '/showcase' || l.href === '/#contacto') : NAV)
  /** Ancho medido de cada link, por href: sobrevive al cambio entre teléfono y escritorio. */
  let linkWidths = $state<Record<string, number>>({})

  const barWidth = $derived(width + (compact ? 0 : 24))
  const y = $derived(engine.viewport.height / 2 - MARGIN - HEIGHT / 2)
  const right = $derived(barWidth / 2 - PADDING)
  const logoX = $derived(-barWidth / 2 + PADDING)

  /** Borde derecho del link `i`: se acomodan de derecha a izquierda. */
  function linkRight(i: number): number {
    let x = right
    for (let j = links.length - 1; j > i; j--) x -= (linkWidths[links[j]!.href] ?? 0) + LINK_GAP
    return x
  }

  // La barra no deja pasar el puntero al contenido que se mueve debajo.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()
</script>

<!-- z = 10: el último nivel de captura; la barra refracta lo que pasa por debajo. -->
<Glass
  preset="crystal-ui"
  width={barWidth}
  height={HEIGHT}
  radius={HEIGHT / 2}
  tint="#ffffff"
  tintOpacity={0.55}
  brightness={0.05}
  blur={12}
  rim={0.25}
  shadowOpacity={0}
  {y}
  z={10}
  onclick={stop}
  onpointermove={stop}
/>

<!-- El imagotipo lleva al inicio; su nombre lo da el link «Tres Medusas» de la capa semántica. -->
{#if focusedHref === '/'}
  <Rect width={logoWidth + 20} height={LOGO_HEIGHT + 14} radius={(LOGO_HEIGHT + 14) / 2} color={PALETTE.brand} opacity={0.18} x={logoX + logoWidth / 2} {y} z={10.04} />
{/if}
<T.Group onclick={() => onnavigate('/')} onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
  <Image src={LOGO.imagotipo.src} width={logoWidth} height={LOGO_HEIGHT} x={logoX + logoWidth / 2} {y} z={10.05} />
</T.Group>

{#each links as link, i (link.href)}
  <NavLink
    {link}
    color={activeHref === link.href ? PALETTE.brandInk : PALETTE.ink}
    anchorX={1}
    x={linkRight(i)}
    {y}
    z={10.05}
    focused={focusedHref === link.href}
    onmeasure={(w) => (linkWidths[link.href] = w)}
    {onnavigate}
  />
{/each}
