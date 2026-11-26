<script lang="ts">
  import type { Project } from '$lib/content.js'
  import CaseDetail from './case-detail.svelte'
  import type { ScreenRect } from './case-transition.js'
  import type { Deck } from './deck.svelte.js'
  import SceneSlot from './scene-slot.svelte'

  /** La página de un caso: una sola escena, con scroll interno si no entra. */
  interface Props {
    deck: Deck
    project: Project
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    year: number
    /** La card no se dibuja: la transición la trae volando. */
    hideCard: boolean
    focusedHref: string | null
    onnavigate: (href: string) => void
    /** Dónde queda la card en la ventana: el destino de la transición. */
    onanchor: (rect: ScreenRect) => void
  }

  let { deck, project, width, viewportWidth, viewportHeight, compact, year, hideCard, focusedHref, onnavigate, onanchor }: Props = $props()

  let height = $state(0)
</script>

<SceneSlot i={0} {deck} {width} {viewportHeight} {height}>
  {#snippet children(_d, frame, _slide, rise)}
    <CaseDetail
      {project}
      {width}
      {viewportWidth}
      {viewportHeight}
      {compact}
      {frame}
      originY={viewportHeight / 2 - frame.top + deck.shift(0) + rise}
      {year}
      {hideCard}
      {focusedHref}
      onmeasure={(h) => (height = h)}
      {onnavigate}
      {onanchor}
    />
  {/snippet}
</SceneSlot>
