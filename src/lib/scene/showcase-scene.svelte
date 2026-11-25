<script lang="ts">
  import { SHOWCASE, SHOWCASE_SCENES } from '$lib/content.js'
  import Closing from './closing.svelte'
  import type { Deck } from './deck.svelte.js'
  import { cameraX, galleryView, smoothstep, wallOf, wallX } from './gallery.js'
  import GallerySlot from './gallery-slot.svelte'
  import Hall from './hall.svelte'
  import { NAV_SPACE, SCENE_BOTTOM } from './layout.js'
  import Project from './project.svelte'
  import ShowcaseIntro from './showcase-intro.svelte'

  /**
   * El showcase como una galería: un pasillo que va hacia el punto de fuga,
   * con la entrada, un proyecto colgado por escena (en paredes alternas) y el
   * cierre al fondo. El deck es la cámara que lo recorre.
   */
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

  let heights = $state(SHOWCASE_SCENES.map(() => 0))
  const count = SHOWCASE_SCENES.length
  const last = count - 1

  const view = $derived(galleryView(viewportWidth, viewportHeight, compact, NAV_SPACE, SCENE_BOTTOM))
  const camX = $derived(cameraX(deck.position, count, view))
  const common = $derived({ deck, width, viewportHeight, view, camX })
  const wall = (k: number) => wallX(k, count, view)

  function select(order: number) {
    if (!deck.dragged) onnavigate(`#${SHOWCASE.projects[order]!.id}`)
  }
</script>

<!-- Las líneas del pasillo se ven también en un teléfono: son lo que da la profundidad. -->
<Hall position={deck.position} {count} {camX} {view} />

<GallerySlot i={0} {...common} height={heights[0]!} wallX={wall(0)}>
  {#snippet children(_d, _frame, fog)}
    <ShowcaseIntro {width} {compact} opacity={fog.text} {focusedHref} onselect={select} onmeasure={(h) => (heights[0] = h)} />
  {/snippet}
</GallerySlot>

{#each SHOWCASE.projects as project, order (project.id)}
  <GallerySlot i={order + 1} {...common} height={heights[order + 1]!} wallX={wall(order + 1)}>
    {#snippet children(d, _frame, fog, glassZ)}
      <Project
        {project}
        {order}
        total={SHOWCASE.projects.length}
        {width}
        {viewportHeight}
        {compact}
        side={wallOf(order + 1, count) < 0 ? -1 : 1}
        {d}
        {fog}
        {glassZ}
        onmeasure={(h) => (heights[order + 1] = h)}
      />
    {/snippet}
  </GallerySlot>
{/each}

<!--
  El cierre es la pared del fondo. No tiene niebla propia (sus piezas son de
  la home también), así que no se ve de lejos: crece desde el punto de fuga
  mientras la cámara deja el último proyecto. Va plano en z = 0: sus botones
  de vidrio se quedan en el nivel de captura del contenido.
-->
<GallerySlot i={last} {...common} height={heights[last]!} wallX={wall(last)} reveal={smoothstep(-1, -0.15, deck.position - last)} flat>
  {#snippet children(_d, frame)}
    <Closing
      section={SHOWCASE.closing.section}
      links={[SHOWCASE.closing.primary, SHOWCASE.closing.secondary]}
      {width}
      {viewportHeight}
      {compact}
      d={0}
      {frame}
      {year}
      {focusedHref}
      onmeasure={(h) => (heights[last] = h)}
      {onnavigate}
    />
  {/snippet}
</GallerySlot>
