<script lang="ts">
  import { SHOWCASE, SHOWCASE_SCENES } from '$lib/content.js'
  import Closing from './closing.svelte'
  import type { Deck } from './deck.svelte.js'
  import Project from './project.svelte'
  import SceneSlot from './scene-slot.svelte'
  import ShowcaseIntro from './showcase-intro.svelte'

  /** Las escenas del showcase, en el orden de `SHOWCASE_SCENES`: apertura, un proyecto por escena y cierre. */
  interface Props {
    deck: Deck
    width: number
    viewportHeight: number
    compact: boolean
    year: number
    focusedHref: string | null
    onnavigate: (href: string) => void
  }

  let { deck, width, viewportHeight, compact, year, focusedHref, onnavigate }: Props = $props()

  let heights = $state(SHOWCASE_SCENES.map(() => 0))
  const common = $derived({ deck, width, viewportHeight })
  const last = SHOWCASE_SCENES.length - 1

  function select(order: number) {
    if (!deck.dragged) onnavigate(`#${SHOWCASE.projects[order]!.id}`)
  }
</script>

<SceneSlot i={0} {...common} height={heights[0]!}>
  {#snippet children(d)}
    <ShowcaseIntro {width} {viewportHeight} {compact} {d} onselect={select} onmeasure={(h) => (heights[0] = h)} />
  {/snippet}
</SceneSlot>

{#each SHOWCASE.projects as project, order (project.id)}
  <SceneSlot i={order + 1} {...common} height={heights[order + 1]!}>
    {#snippet children(d)}
      <Project {project} {order} total={SHOWCASE.projects.length} {width} {viewportHeight} {compact} {d} onmeasure={(h) => (heights[order + 1] = h)} />
    {/snippet}
  </SceneSlot>
{/each}

<SceneSlot i={last} {...common} height={heights[last]!}>
  {#snippet children(d, frame)}
    <Closing
      section={SHOWCASE.closing.section}
      links={[SHOWCASE.closing.primary, SHOWCASE.closing.secondary]}
      {width}
      {viewportHeight}
      {compact}
      {d}
      {frame}
      {year}
      {focusedHref}
      onmeasure={(h) => (heights[last] = h)}
      {onnavigate}
    />
  {/snippet}
</SceneSlot>
