<script lang="ts">
  import { CONTACT_SECTION, HOME_SCENES } from '$lib/content.js'
  import About from './about.svelte'
  import Closing from './closing.svelte'
  import type { Deck } from './deck.svelte.js'
  import Hero from './hero.svelte'
  import HowWork from './how-work.svelte'
  import SceneSlot from './scene-slot.svelte'

  /** Las escenas de la home, en el orden de `HOME_SCENES`. */
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

  let heights = $state(HOME_SCENES.map(() => 0))
  const common = $derived({ deck, width, viewportHeight })
</script>

<SceneSlot i={0} {...common} height={heights[0]!}>
  {#snippet children(d, frame)}
    <Hero {width} {viewportHeight} {compact} {d} {frame} {focusedHref} onmeasure={(h) => (heights[0] = h)} {onnavigate} />
  {/snippet}
</SceneSlot>

<SceneSlot i={1} {...common} height={heights[1]!}>
  {#snippet children(d)}
    <HowWork {width} {viewportHeight} {compact} {d} onmeasure={(h) => (heights[1] = h)} />
  {/snippet}
</SceneSlot>

<SceneSlot i={2} {...common} height={heights[2]!}>
  {#snippet children(d)}
    <About {width} {viewportHeight} {compact} {d} {focusedHref} onmeasure={(h) => (heights[2] = h)} />
  {/snippet}
</SceneSlot>

<SceneSlot i={3} {...common} height={heights[3]!}>
  {#snippet children(d, frame)}
    <Closing
      section={CONTACT_SECTION.section}
      links={[CONTACT_SECTION.primary, CONTACT_SECTION.secondary, CONTACT_SECTION.tertiary]}
      {width}
      {viewportHeight}
      {compact}
      {d}
      {frame}
      {year}
      {focusedHref}
      onmeasure={(h) => (heights[3] = h)}
      {onnavigate}
    />
  {/snippet}
</SceneSlot>
