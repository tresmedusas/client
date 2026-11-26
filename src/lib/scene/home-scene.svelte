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
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    year: number
    focusedHref: string | null
    onnavigate: (href: string) => void
    /** El movimiento continuo está permitido. @default true */
    motion?: boolean
  }

  let { deck, width, viewportWidth, viewportHeight, compact, year, focusedHref, onnavigate, motion = true }: Props = $props()

  let heights = $state(HOME_SCENES.map(() => 0))
  /** El recorrido de las hojas de «Cómo trabajamos» (0 si van de corrido). */
  let howTrack = $state(0)
  const common = $derived({ deck, width, viewportHeight })
</script>

<SceneSlot i={0} {...common} height={heights[0]!}>
  {#snippet children(d, frame)}
    <Hero {width} {viewportHeight} {compact} {d} {frame} {focusedHref} {motion} onmeasure={(h) => (heights[0] = h)} {onnavigate} />
  {/snippet}
</SceneSlot>

<SceneSlot i={1} {...common} height={heights[1]!} track={howTrack}>
  {#snippet children(d, frame, slide, rise)}
    <!-- Cuánto subió el contenido (transición más scroll interno): las etapas aparecen según dónde quedan en la ventana. En hojas, el resto del scroll interno (`slide`) sube las hojas. -->
    <HowWork
      {width}
      {viewportWidth}
      {viewportHeight}
      {compact}
      {d}
      top={frame.top - deck.shift(1) - rise}
      {slide}
      {motion}
      onmeasure={(h) => (heights[1] = h)}
      ontrack={(t) => (howTrack = t)}
    />
  {/snippet}
</SceneSlot>

<SceneSlot i={2} {...common} height={heights[2]!}>
  {#snippet children()}
    <About {width} {viewportHeight} {compact} {focusedHref} onmeasure={(h) => (heights[2] = h)} />
  {/snippet}
</SceneSlot>

<SceneSlot i={3} {...common} height={heights[3]!}>
  {#snippet children()}
    <Closing
      section={CONTACT_SECTION.section}
      links={[CONTACT_SECTION.primary, CONTACT_SECTION.secondary, CONTACT_SECTION.tertiary]}
      align="center"
      size="section"
      {width}
      {viewportWidth}
      {viewportHeight}
      {compact}
      {year}
      {focusedHref}
      onmeasure={(h) => (heights[3] = h)}
      {onnavigate}
    />
  {/snippet}
</SceneSlot>
