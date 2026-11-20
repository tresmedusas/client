<script lang="ts">
  import { untrack, type Snippet } from 'svelte'
  import { T } from '@threlte/core'
  import type { Deck } from './deck.svelte.js'
  import { sceneFrame, type SceneFrame } from './deck-logic.js'
  import { depthScale, fade, type Fade, type GalleryView } from './gallery.js'
  import { NAV_SPACE, SCENE_BOTTOM } from './layout.js'

  /**
   * Una escena de la galería del showcase. Como `SceneSlot`, ubica su
   * contenido en la ventana (centrado bajo la navbar, o arriba con scroll
   * interno si no entra), pero en vez de correrlo hacia arriba lo cuelga en
   * el pasillo: lo escala hacia el punto de fuga según su profundidad y lo
   * corre según dónde esté la cámara.
   */
  interface Props {
    i: number
    deck: Deck
    width: number
    viewportHeight: number
    /** Alto del contenido medido; 0 hasta medir (la escena no se dibuja). */
    height: number
    view: GalleryView
    /** Pared donde cuelga, en px a lo ancho del pasillo. */
    wallX: number
    /** Dónde está la cámara a lo ancho del pasillo. */
    camX: number
    /** Escala extra (0..1) para una escena que no tiene que verse de lejos. @default 1 */
    reveal?: number
    /**
     * Fija la escena en z = 0 aunque se mueva: para la que tiene vidrios que no
     * controla (el cierre), así sus vidrios no abren otro nivel de captura.
     * @default false
     */
    flat?: boolean
    /**
     * `d`: corrimiento en escenas; `frame`: dónde quedó el contenido; `fog`: su
     * opacidad; `glassZ`: la z local que deja un vidrio en z = 1 del mundo (el
     * nivel de captura del contenido), sea cual sea la profundidad.
     */
    children: Snippet<[number, SceneFrame, Fade, number]>
  }

  let { i, deck, width, viewportHeight, height, view, wallX, camX, reveal = 1, flat = false, children }: Props = $props()

  const d = $derived(deck.position - i)
  const frame = $derived(sceneFrame(height, viewportHeight, NAV_SPACE, SCENE_BOTTOM))
  const depth = $derived(depthScale(d, view))
  const fog = $derived(fade(d))
  const visible = $derived(height > 0 && depth !== null && reveal > 0.001 && (fog.art > 0.001 || fog.text > 0.001))
  const scale = $derived((depth ?? 1) * reveal)
  /**
   * Lo más cerca, arriba: la escena que pasa de largo tapa a las que vienen
   * detrás. En reposo, z = 0 como cualquier escena del deck.
   */
  const z = $derived(flat ? 0 : Math.max(-0.35, Math.min(0.1, d * 0.1)))

  $effect(() => {
    if (height <= 0) return
    const { top, overflow } = frame
    untrack(() => deck.setFrame(i, top, height, overflow))
  })
</script>

<!-- Escala alrededor del punto de fuga; adentro, el layout de una escena en reposo. -->
<T.Group
  position.x={(wallX - camX) * scale}
  position.y={view.vanishY * (1 - scale)}
  position.z={z}
  scale.x={scale}
  scale.y={scale}
  {visible}
>
  <T.Group position.x={-width / 2} position.y={viewportHeight / 2 - frame.top + deck.innerOf(i)}>
    {@render children(d, frame, fog, 1 - z)}
  </T.Group>
</T.Group>
