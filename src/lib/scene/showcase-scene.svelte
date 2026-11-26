<script lang="ts">
  import type { Project } from '$lib/content.js'
  import type { ScreenRect } from './case-transition.js'
  import type { Deck } from './deck.svelte.js'
  import type { WarpLook } from './edge-warp.js'
  import SceneSlot from './scene-slot.svelte'
  import ShowcaseFeed from './showcase-feed.svelte'

  /**
   * El showcase: una sola escena, la entrada con el título y los casos en
   * fila, que pasan de derecha a izquierda con el scroll (el recorrido
   * horizontal de su escena). Por ahora sin cierre (pedido del usuario,
   * 2026-11-25). Los bordes izquierdo y derecho estiran los casos al pasar, y los
   * de arriba y abajo los reflejan (`SHOWCASE_WARP` con el eje horizontal,
   * en `site-scene.svelte`).
   */
  interface Props {
    deck: Deck
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    /** Tamaño de las franjas de los costados (px). */
    band: number
    /** El look de los bordes: de él sale cuándo se enciende el reflejo. */
    look: WarpLook
    /** El movimiento continuo (la palabra que rota en el título) está permitido. */
    motion: boolean
    focusedHref: string | null
    /** Click en una card: la página del caso. */
    onnavigate: (href: string) => void
    /** Click en una card: la transición a la página del caso. */
    onopencase: (project: Project, index: number, href: string, from: ScreenRect) => void
    /** Cuánto se enciende el reflejo (0 a 1): un caso en el centro de la ventana. */
    onfocus: (focus: number) => void
  }

  let { deck, width, viewportWidth, viewportHeight, compact, band, look, motion, focusedHref, onnavigate, onopencase, onfocus }: Props = $props()

  let height = $state(0)
  let track = $state(0)
  const common = $derived({ deck, width, viewportHeight })
</script>

<SceneSlot i={0} {...common} {height} {track}>
  {#snippet children(d, frame, slide, rise)}
    <ShowcaseFeed
      {width}
      {viewportWidth}
      {viewportHeight}
      {compact}
      {band}
      {look}
      {d}
      {slide}
      {motion}
      {focusedHref}
      {onopencase}
      originY={viewportHeight / 2 - frame.top + deck.shift(0) + rise}
      reveal={frame.overflow > 0 ? rise / frame.overflow : 0}
      onmeasure={(h, t) => {
        height = h
        track = t
      }}
      {onfocus}
    />
  {/snippet}
</SceneSlot>

