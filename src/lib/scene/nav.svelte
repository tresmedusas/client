<script lang="ts">
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { NAV, SITE } from '$lib/content.js'
  import { FONT } from '$lib/tokens.js'
  import NavLink from './nav-link.svelte'

  interface Props {
    /** Ancho de la columna: la barra la acompaña. */
    width: number
    compact: boolean
    focusedHref: string | null
    onnavigate: (href: string) => void
  }

  let { width, compact, focusedHref, onnavigate }: Props = $props()

  const engine = useEngine()

  const HEIGHT = 56
  const MARGIN = 16
  const PADDING = 22
  const LINK_GAP = 28

  /** En un teléfono solo entra el link de contacto. */
  const links = $derived(compact ? NAV.filter((l) => l.href === '#contacto') : NAV)
  /** Ancho medido de cada link, por href: sobrevive al cambio entre teléfono y escritorio. */
  let linkWidths = $state<Record<string, number>>({})

  const barWidth = $derived(width + (compact ? 0 : 24))
  const y = $derived(engine.viewport.height / 2 - MARGIN - HEIGHT / 2)
  const right = $derived(barWidth / 2 - PADDING)

  /** Borde derecho del link `i`: se acomodan de derecha a izquierda. */
  function linkRight(i: number): number {
    let x = right
    for (let j = links.length - 1; j > i; j--) x -= (linkWidths[links[j]!.href] ?? 0) + LINK_GAP
    return x
  }

  // La barra no deja pasar el puntero al contenido que scrollea debajo.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()
</script>

<!-- z = 10: el último nivel de captura; la barra refracta lo que pasa por debajo. -->
<Glass
  preset="crystal-ui"
  width={barWidth}
  height={HEIGHT}
  radius={HEIGHT / 2}
  tint="#0b1d3a"
  tintOpacity={0.35}
  tintMode="dye"
  blur={12}
  rim={0.25}
  shadowOpacity={0}
  {y}
  z={10}
  onclick={stop}
  onpointermove={stop}
/>

<NavLink
  link={{ label: SITE.name, href: '#inicio' }}
  fontSize={17}
  font={FONT.bold}
  x={-barWidth / 2 + PADDING}
  {y}
  z={10.05}
  focused={focusedHref === '#inicio'}
  {onnavigate}
/>

{#each links as link, i (link.href)}
  <NavLink {link} anchorX={1} x={linkRight(i)} {y} z={10.05} focused={focusedHref === link.href} onmeasure={(w) => (linkWidths[link.href] = w)} {onnavigate} />
{/each}
