<script lang="ts">
  import { SHOWCASE } from '$lib/content.js'
  import Closing from './closing.svelte'
  import type { Deck } from './deck.svelte.js'
  import type { WarpLook } from './edge-warp.js'
  import SceneSlot from './scene-slot.svelte'
  import ShowcaseFeed from './showcase-feed.svelte'

  /**
   * El showcase: la entrada con los casos uno debajo del otro (una escena que
   * scrollea adentro) y el cierre. Los bordes de la ventana estiran y
   * reflejan los casos al pasar (`SHOWCASE_WARP`, en `site-scene.svelte`).
   */
  interface Props {
    deck: Deck
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    year: number
    focusedHref: string | null
    /** Alto de cada franja de los bordes (px CSS). */
    band: number
    /** El look de los bordes: de él sale cuándo se enciende el reflejo. */
    look: WarpLook
    onnavigate: (href: string) => void
    /** Cuánto se enciende el reflejo de los costados (0 a 1): un caso en el centro de la ventana. */
    onfocus: (focus: number) => void
  }

  let { deck, width, viewportWidth, viewportHeight, compact, year, focusedHref, band, look, onnavigate, onfocus }: Props = $props()

  let heights = $state([0, 0])
  const common = $derived({ deck, width, viewportHeight })
</script>

<SceneSlot i={0} {...common} height={heights[0]!}>
  {#snippet children(_, frame)}
    <!-- Mismo corrimiento que el grupo de SceneSlot: dónde queda el feed en la ventana. -->
    <ShowcaseFeed
      {width}
      {compact}
      {band}
      {look}
      origin={viewportHeight / 2 - frame.top + deck.shift(0) + deck.innerOf(0)}
      onmeasure={(h) => (heights[0] = h)}
      {onfocus}
    />
  {/snippet}
</SceneSlot>

<SceneSlot i={1} {...common} height={heights[1]!}>
  {#snippet children()}
    <Closing
      section={SHOWCASE.closing.section}
      links={[SHOWCASE.closing.primary, SHOWCASE.closing.secondary]}
      align="center"
      {width}
      {viewportWidth}
      {viewportHeight}
      {compact}
      {year}
      {band}
      {focusedHref}
      onmeasure={(h) => (heights[1] = h)}
      {onnavigate}
    />
  {/snippet}
</SceneSlot>
