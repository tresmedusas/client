<script lang="ts">
  import { untrack } from 'svelte'
  import { useTask } from '@threlte/core'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { rotatingAt, type RotatingTitle } from './headline.js'
  import { TITLE_LINE, flow } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  /**
   * Un titular con una palabra que rota, como el del hero (pedido del
   * usuario, 2026-11-25, para el showcase): el texto fijo en `muted` y
   * regular, la palabra que rota en `ink` y black. Cada palabra es un texto
   * aparte, acomodado como texto centrado (`flow`); al cambiar la palabra, el
   * resto se corre suave a su nuevo lugar. En escritorio, un `\n` en el texto
   * fijo corta la línea ahí (como los cortes del hero); en una columna, todo
   * va seguido y se parte donde haga falta. Cada variante es su propio texto,
   * medido de entrada: el alto que se informa es el de la variante que más
   * líneas ocupa, así lo que va debajo no salta al rotar.
   */
  interface Props {
    title: RotatingTitle
    fontSize: number
    /** Ancho máximo, centrado en `x`. */
    maxWidth: number
    /** Centro. */
    x: number
    /** Borde de arriba. */
    y?: number
    /** @default 1 */
    opacity?: number
    /** La palabra rota; si no, queda en la primera. @default true */
    motion?: boolean
    /** En una columna (teléfono): sin los cortes de línea del texto. @default false */
    compact?: boolean
    onmeasure?: (height: number) => void
  }

  let { title, fontSize, maxWidth, x, y = 0, opacity = 1, motion = true, compact = false, onmeasure }: Props = $props()

  /** El texto fijo, palabra por palabra, con una clave estable; `breakBefore`: después de un `\n`. */
  function words(text: string, prefix: string) {
    return text
      .split('\n')
      .flatMap((line, l) => line.split(' ').filter(Boolean).map((word, i) => ({ text: word, breakBefore: l > 0 && i === 0 })))
      .map((w, i) => ({ ...w, key: `${prefix}${i}` }))
  }
  const before = $derived(words(title.before, 'b'))
  const after = $derived(words(title.after, 'a'))
  const fixed = $derived([...before, ...after])

  /** Ancho medido de cada palabra fija (por `key`) y de cada variante (`w0`, `w1`…). */
  let widths = $state<Record<string, number>>({})
  const ready = $derived(fixed.every((w) => widths[w.key] !== undefined) && title.words.every((_, i) => widths[`w${i}`] !== undefined))

  const lineStep = $derived(fontSize * TITLE_LINE)
  /** El espacio de Lato, con el interletrado (el mismo que el hero). */
  const space = $derived(fontSize * 0.24)

  /** Dónde va cada palabra con la variante `index`: `slot` es la que rota. x: borde izquierdo; y: fila. */
  function layout(index: number) {
    const order = [...before, { key: 'slot', breakBefore: false }, ...after]
    // Un tramo por línea fija (en escritorio); cada uno se acomoda centrado y se parte si no entra.
    const groups: (typeof order)[] = []
    for (const w of order) {
      if (groups.length === 0 || (w.breakBefore && !compact)) groups.push([])
      groups.at(-1)!.push(w)
    }
    const at: Record<string, { x: number; row: number }> = {}
    let rows = 0
    for (const group of groups) {
      const f = flow(
        group.map((w) => (w.key === 'slot' ? widths[`w${index}`] : widths[w.key]) ?? 0),
        maxWidth,
        space,
        'center',
      )
      group.forEach((w, i) => (at[w.key] = { x: x - maxWidth / 2 + f.x[i]!, row: rows + f.row[i]! }))
      rows += f.rows
    }
    return { at, rows }
  }

  /** Las líneas de la variante más larga: el alto del titular. */
  const rows = $derived(ready ? Math.max(...title.words.map((_, i) => layout(i).rows)) : 1)
  const height = $derived((rows - 1) * lineStep + fontSize)
  $effect(() => {
    if (ready) onmeasure?.(height)
  })

  // ── Rotación ─────────────────────────────────────────────────
  let time = $state(0)
  const now = $derived(motion ? rotatingAt(title, time) : { index: 0, opacity: 1 })

  /** Dónde van las palabras con la variante que se ve, centradas en el alto del titular. */
  const target = $derived.by(() => {
    const { at, rows: own } = layout(now.index)
    const shift = (rows - own) / 2
    return Object.fromEntries(Object.entries(at).map(([key, p]) => [key, { x: p.x, row: p.row + shift }]))
  })

  // Lo que se ve: cada palabra se acerca a su lugar.
  let shown = $state<Record<string, { x: number; row: number }>>({})
  const EASE = 10
  function settle(delta: number) {
    const k = ready && motion ? 1 - Math.exp(-delta * EASE) : 1
    const next: Record<string, { x: number; row: number }> = {}
    for (const [key, to] of Object.entries(target)) {
      const from = shown[key] ?? to
      next[key] = { x: from.x + (to.x - from.x) * k, row: from.row + (to.row - from.row) * k }
    }
    shown = next
  }
  // Corre solo con el titular a la vista: en el showcase se apaga al scrollear.
  const running = $derived(motion && opacity > 0.001)
  useTask(
    (delta) => {
      time += delta
      settle(delta)
    },
    { running: () => running },
  )
  // Sin movimiento (o sin verse), todo va directo a su lugar.
  $effect(() => {
    if (!running) {
      void target
      untrack(() => settle(1))
    }
  })

  const at = (key: string) => shown[key] ?? target[key] ?? { x: 0, row: 0 }
  const shared = $derived({ fontSize, lineHeight: TITLE_LINE, letterSpacing: -fontSize * 0.02 })
</script>

{#each fixed as w (w.key)}
  <MeasuredText
    text={w.text}
    {...shared}
    font={FONT.regular}
    color={PALETTE.muted}
    x={at(w.key).x}
    y={y - at(w.key).row * lineStep}
    opacity={ready ? opacity : 0}
    onmeasure={(wd) => (widths[w.key] = wd)}
  />
{/each}
{#each title.words as word, i (word)}
  <MeasuredText
    text={word}
    {...shared}
    font={FONT.black}
    color={PALETTE.ink}
    x={at('slot').x}
    y={y - at('slot').row * lineStep}
    opacity={ready && i === now.index ? opacity * now.opacity : 0}
    onmeasure={(wd) => (widths[`w${i}`] = wd)}
  />
{/each}
