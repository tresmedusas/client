<script lang="ts">
  // Titular inline (ver DESIGN.md §3), como el del hero: el texto en `muted` y
  // regular, lo destacado (`**…**` en el contenido) en `ink` y black. troika
  // no mezcla fuentes en un texto, así que cada tramo es un texto aparte y las
  // palabras se acomodan como texto con `flow`; el ajuste de línea es el del
  // título entero.
  import { headlineTokens } from '$lib/inline-headline.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { flow } from './layout.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    text: string
    fontSize: number
    maxWidth: number
    /** @default 1.1 */
    lineHeight?: number
    letterSpacing?: number
    /** `center`: cada línea centrada en `x`; `left`: alineadas a `x`. @default 'center' */
    alignment?: 'center' | 'left'
    x?: number
    /** Borde de arriba. */
    y?: number
    z?: number
    opacity?: number
    onmeasure?: (width: number, height: number) => void
  }

  let { text, fontSize, maxWidth, lineHeight = 1.1, letterSpacing = 0, alignment = 'center', x = 0, y = 0, z = 0, opacity = 1, onmeasure }: Props = $props()

  const words = $derived(headlineTokens(text))
  /** Ancho medido de cada tramo, por `palabra:tramo`. */
  let widths = $state<Record<string, number>>({})
  const key = (w: number, p: number) => `${w}:${p}`
  const ready = $derived(words.every((pieces, w) => pieces.every((_, p) => widths[key(w, p)] !== undefined)))

  /** El espacio de Lato, con el interletrado (el mismo que el hero). */
  const space = $derived(fontSize * 0.24)
  const lineStep = $derived(fontSize * lineHeight)
  const wordWidths = $derived(words.map((pieces, w) => pieces.reduce((sum, _, p) => sum + (widths[key(w, p)] ?? 0), 0)))
  const layout = $derived(flow(wordWidths, maxWidth, space, alignment === 'center' ? 'center' : 'start'))
  const left = $derived(alignment === 'center' ? x - maxWidth / 2 : x)
  /** Ancho de la línea más larga. */
  const width = $derived.by(() => {
    const used: number[] = []
    wordWidths.forEach((ww, i) => {
      const row = layout.row[i]!
      used[row] = Math.max(used[row] ?? 0, layout.x[i]! + ww)
    })
    const starts: number[] = []
    layout.x.forEach((lx, i) => {
      const row = layout.row[i]!
      starts[row] = Math.min(starts[row] ?? Infinity, lx)
    })
    return Math.max(0, ...used.map((u, r) => u - (starts[r] ?? 0)))
  })

  $effect(() => {
    if (ready) onmeasure?.(width, layout.rows * lineStep)
  })

  /** Borde izquierdo del tramo `p` de la palabra `w`. */
  const pieceX = (w: number, p: number) => {
    let at = left + (layout.x[w] ?? 0)
    for (let k = 0; k < p; k++) at += widths[key(w, k)] ?? 0
    return at
  }
</script>

{#each words as pieces, w (`${w}:${pieces.map((piece) => piece.text).join('')}`)}
  {#each pieces as piece, p (p)}
    <MeasuredText
      text={piece.text}
      {fontSize}
      font={piece.accent ? FONT.black : FONT.regular}
      color={piece.accent ? PALETTE.ink : PALETTE.muted}
      {lineHeight}
      {letterSpacing}
      x={pieceX(w, p)}
      y={y - (layout.row[w] ?? 0) * lineStep}
      {z}
      opacity={ready ? opacity : 0}
      onmeasure={(pw) => (widths[key(w, p)] = pw)}
    />
  {/each}
{/each}
