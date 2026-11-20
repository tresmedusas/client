<script lang="ts">
  import { untrack, type Snippet } from 'svelte'
  import { T } from '@threlte/core'
  import type { Deck } from './deck.svelte.js'
  import { sceneFrame, type SceneFrame } from './deck-logic.js'
  import { NAV_SPACE, SCENE_TOP } from './layout.js'

  /**
   * Una escena del deck. Ubica su contenido en la ventana (centrado sobre la
   * navbar, o arriba con scroll interno si no entra) y lo corre lo que diga el
   * deck: la escena que viene sube desde abajo y la que se va sale por arriba.
   * El contenido recibe el corrimiento en escenas (`d`) para su propio parallax.
   */
  interface Props {
    i: number
    deck: Deck
    /** Ancho de la columna. */
    width: number
    viewportHeight: number
    /** Alto del contenido medido; 0 hasta medir (la escena no se dibuja). */
    height: number
    /** `d`: corrimiento en escenas (0 = en pantalla); `frame`: dónde quedó el contenido. */
    children: Snippet<[number, SceneFrame]>
  }

  let { i, deck, width, viewportHeight, height, children }: Props = $props()

  const d = $derived(deck.position - i)
  const frame = $derived(sceneFrame(height, viewportHeight, SCENE_TOP, NAV_SPACE))

  $effect(() => {
    if (height <= 0) return
    const { top, overflow } = frame
    untrack(() => deck.setFrame(i, top, height, overflow))
  })
</script>

<!-- Fuera de pantalla no se dibuja: con |d| ≥ 1 la escena ya salió (el parallax solo la aleja más). -->
<T.Group
  position.x={-width / 2}
  position.y={viewportHeight / 2 - frame.top + deck.shift(i) + deck.innerOf(i)}
  visible={height > 0 && Math.abs(d) < 1.6}
>
  {@render children(d, frame)}
</T.Group>
