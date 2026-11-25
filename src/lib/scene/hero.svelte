<script lang="ts">
  import { untrack } from 'svelte'
  import { T, useTask } from '@threlte/core'
  import { HERO } from '$lib/content.js'
  import { figureAt } from './figures/hero.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import type { SceneFrame } from './deck-logic.js'
  import { headlineAt, headlineWords, widestHeadline, type HeadlineWord } from './headline.js'
  import HeroFigure from './hero-figure.svelte'
  import { CTA_HEIGHT, NAV_SPACE, SCENE_TOP, TITLE_LINE, flow, heroLayout } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import PrismCta from './prism-cta.svelte'

  /**
   * Hero: el titular, el botón y, debajo, la figura de lo que nombra el
   * titular, centrados en la columna y en el alto libre, sobre el papel liso.
   * Sin logo ni luz de fondo (pedidos del usuario, 2026-11-24).
   *
   * El titular tiene palabras que rotan (`headline.ts`): el texto fijo va en
   * `muted` y regular, y las palabras que rotan, en `ink` y black. Cada
   * palabra es un texto aparte, acomodado como texto centrado (`flow`); al
   * cambiar una, el resto se corre suave a su nuevo lugar.
   */
  interface Props {
    width: number
    viewportHeight: number
    compact: boolean
    /** Corrimiento de la escena (0 = en pantalla). */
    d: number
    /** No se usa: el hero ocupa toda la ventana. */
    frame?: SceneFrame
    focusedHref: string | null
    /** El movimiento continuo (las palabras que rotan, la figura y el botón) está permitido. @default true */
    motion?: boolean
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { width, viewportHeight, compact, d, focusedHref, motion = true, onmeasure, onnavigate }: Props = $props()

  const H = HERO.headline

  // Reloj del titular, la figura y el botón: corre solo con el hero a la vista.
  let time = $state(0)

  // ── Titular ──────────────────────────────────────────────────────
  // Con movimiento reducido, quieto en la primera combinación.
  const now = $derived<HeadlineWord[]>(motion ? headlineAt(H, time) : headlineWords(H))
  // Las palabras cambian de texto cada tanto, la opacidad en cada frame: por
  // separado, para que el texto no se vuelva a maquetar en cada frame.
  const signature = $derived(now.map((w) => w.text).join(' '))
  const words = $derived.by(() => {
    void signature
    return untrack(() => now.map(({ key, text, accent, breakBefore }) => ({ key, text, accent, breakBefore })))
  })
  const opacity = $derived(Object.fromEntries(now.map((w) => [w.key, w.opacity])))
  /** Ancho medido de cada palabra, por su `key`. */
  let widths = $state<Record<string, number>>({})
  const ready = $derived(words.every((w) => widths[w.key] !== undefined))

  let titleHeight = $state(0)
  let ctaWidth = $state(0)
  const layout = $derived(heroLayout(width, viewportHeight, compact, widestHeadline(H), titleHeight || undefined))
  /** Entre líneas, y entre palabras (el espacio de Lato, con el interletrado). */
  const lineStep = $derived(layout.titleSize * TITLE_LINE)
  const space = $derived(layout.titleSize * 0.24)

  /**
   * Dónde va cada palabra: en escritorio, una línea por cada corte del
   * titular; en una columna, todo seguido. Cada tramo se acomoda centrado y
   * se parte si no entra. x: borde izquierdo en la columna; y: fila.
   */
  const target = $derived.by(() => {
    const groups: (typeof words)[] = []
    for (const w of words) {
      if (groups.length === 0 || (w.breakBefore && !compact)) groups.push([])
      groups.at(-1)!.push(w)
    }
    const left = width / 2 - layout.textWidth / 2
    const at: Record<string, { x: number; row: number }> = {}
    let rows = 0
    for (const group of groups) {
      const f = flow(
        group.map((w) => widths[w.key] ?? 0),
        layout.textWidth,
        space,
        'center',
      )
      group.forEach((w, i) => (at[w.key] = { x: left + f.x[i]!, row: rows + f.row[i]! }))
      rows += f.rows
    }
    return { at, rows }
  })

  $effect(() => {
    if (ready) titleHeight = (target.rows - 1) * lineStep + layout.titleSize
  })

  // Lo que se ve: cada palabra (y el alto del titular) se acerca a su lugar.
  let shown = $state<Record<string, { x: number; row: number }>>({})
  let shownHeight = $state(0)
  const EASE = 10
  function settle(delta: number) {
    const k = ready && motion ? 1 - Math.exp(-delta * EASE) : 1
    const next: Record<string, { x: number; row: number }> = {}
    for (const [key, to] of Object.entries(target.at)) {
      const from = shown[key] ?? to
      next[key] = { x: from.x + (to.x - from.x) * k, row: from.row + (to.row - from.row) * k }
    }
    shown = next
    shownHeight = shownHeight === 0 ? titleHeight : shownHeight + (titleHeight - shownHeight) * k
  }
  useTask(
    (delta) => {
      time += delta
      settle(delta)
    },
    { running: () => motion && Math.abs(d) < 1 },
  )
  // Sin movimiento (o fuera de la vista), todo va directo a su lugar.
  $effect(() => {
    if (!(motion && Math.abs(d) < 1)) {
      void target
      void titleHeight
      untrack(() => settle(1))
    }
  })

  // La escena ocupa toda la ventana (el slot la deja a `SCENE_TOP` del borde).
  const titleY = $derived(-(layout.textTop - SCENE_TOP))
  const ctaY = $derived(titleY - (shownHeight || layout.titleSize * TITLE_LINE) - layout.gap)

  // ── Figura ───────────────────────────────────────────────────────
  // Sigue al titular: cambia cuando cambia «qué construimos».
  const figure = $derived(motion ? figureAt(H, time) : { from: 0, to: 0, p: 1 })
  const figureY = $derived(ctaY - CTA_HEIGHT - layout.figureGap - layout.figureHeight / 2)

  $effect(() => {
    if (ready && ctaWidth > 0) onmeasure(viewportHeight - SCENE_TOP - NAV_SPACE)
  })

  /** Parallax de salida: lo de abajo se va antes. */
  const lag = (k: number) => d * viewportHeight * k
</script>

{#each words as w (w.key)}
  {@const at = shown[w.key] ?? target.at[w.key]}
  <MeasuredText
    text={w.text}
    fontSize={layout.titleSize}
    font={w.accent ? FONT.black : FONT.regular}
    color={w.accent ? PALETTE.ink : PALETTE.muted}
    lineHeight={TITLE_LINE}
    letterSpacing={-layout.titleSize * 0.02}
    x={at?.x ?? 0}
    y={titleY - (at?.row ?? 0) * lineStep + lag(0.06)}
    opacity={ready ? (opacity[w.key] ?? 1) : 0}
    onmeasure={(wd) => (widths[w.key] = wd)}
  />
{/each}
{#if layout.figureWidth > 0}
  <T.Group position.y={lag(0.34)}>
    <HeroFigure
      from={figure.from}
      to={figure.to}
      p={figure.p}
      width={layout.figureWidth}
      height={layout.figureHeight}
      x={width / 2}
      y={figureY}
      opacity={ready ? 1 : 0}
    />
  </T.Group>
{/if}
<T.Group position.y={lag(0.22)}>
  <PrismCta
    link={HERO.primary}
    x={width / 2 - ctaWidth / 2}
    y={ctaY}
    {time}
    focused={focusedHref === HERO.primary.href}
    {motion}
    onmeasure={(w) => (ctaWidth = w)}
    {onnavigate}
  />
</T.Group>
