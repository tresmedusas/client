<script lang="ts">
  import { untrack, type Snippet } from 'svelte'
  import { T } from '@threlte/core'
  import type { Deck } from './deck.svelte.js'
  import { sceneFrame, type SceneFrame } from './deck-logic.js'
  import { NAV_SPACE, SCENE_BOTTOM } from './layout.js'

  /**
   * Una escena del deck. Ubica su contenido en la ventana (centrado bajo la
   * navbar, o arriba con scroll interno si no entra) y lo corre lo que diga el
   * deck: la escena que viene sube desde abajo y la que se va sale por arriba.
   * El contenido recibe el corrimiento en escenas (`d`) para su propio parallax.
   *
   * Con `track`, la escena tiene además un recorrido horizontal (la fila de
   * casos del showcase): el deck lo scrollea como parte del scroll interno,
   * después del vertical, pero el contenido no sube: lo recibe como `slide`
   * y lo corre hacia la izquierda.
   */
  interface Props {
    i: number
    deck: Deck
    /** Ancho de la columna. */
    width: number
    viewportHeight: number
    /** Alto del contenido medido; 0 hasta medir (la escena no se dibuja). */
    height: number
    /** Recorrido horizontal (px) que se scrollea después del vertical. @default 0 */
    track?: number
    /**
     * `d`: corrimiento en escenas (0 = en pantalla); `frame`: dónde quedó el
     * contenido; `slide`: cuánto del recorrido horizontal va (0 a `track`);
     * `rise`: cuánto subió con el scroll interno (0 a `frame.overflow`).
     */
    children: Snippet<[number, SceneFrame, number, number]>
  }

  let { i, deck, width, viewportHeight, height, track = 0, children }: Props = $props()

  const d = $derived(deck.position - i)
  const frame = $derived(sceneFrame(height, viewportHeight, NAV_SPACE, SCENE_BOTTOM))

  $effect(() => {
    if (height <= 0) return
    const { top, overflow } = frame
    // El recorrido horizontal suma scroll interno y alto por igual: para el
    // deck, el borde de abajo de la escena en pantalla queda donde está.
    const extra = Math.max(0, track)
    untrack(() => deck.setFrame(i, top, height + extra, overflow + extra))
  })

  /** El scroll interno: primero el vertical (lo que no entra), después el horizontal. */
  const rise = $derived(Math.min(deck.innerOf(i), frame.overflow))
  const slide = $derived(Math.max(0, deck.innerOf(i) - frame.overflow))
</script>

<!-- Fuera de pantalla no se dibuja: con |d| ≥ 1 la escena ya salió (el parallax solo la aleja más). -->
<T.Group
  position.x={-width / 2}
  position.y={viewportHeight / 2 - frame.top + deck.shift(i) + rise}
  visible={height > 0 && Math.abs(d) < 1.6}
>
  {@render children(d, frame, slide, rise)}
</T.Group>
