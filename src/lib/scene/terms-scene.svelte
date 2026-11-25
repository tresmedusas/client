<script lang="ts">
  import type { Deck } from './deck.svelte.js'
  import SceneSlot from './scene-slot.svelte'
  import Terms from './terms.svelte'

  /** La página de términos: una sola escena, con scroll interno si no entra. */
  interface Props {
    deck: Deck
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    year: number
    focusedHref: string | null
    onnavigate: (href: string) => void
  }

  let { deck, width, viewportWidth, viewportHeight, compact, year, focusedHref, onnavigate }: Props = $props()

  let height = $state(0)
</script>

<SceneSlot i={0} {deck} {width} {viewportHeight} {height}>
  {#snippet children(_d, frame)}
    <Terms {width} {viewportWidth} {viewportHeight} {compact} {frame} {year} {focusedHref} onmeasure={(h) => (height = h)} {onnavigate} />
  {/snippet}
</SceneSlot>
