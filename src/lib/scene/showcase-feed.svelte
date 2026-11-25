<script lang="ts">
  import { T } from '@threlte/core'
  import { SHOWCASE } from '$lib/content.js'
  import CaseCard from './case-card.svelte'
  import { reflectFocus, type WarpLook } from './edge-warp.js'
  import { SCENE_BOTTOM, caseCard, feedTopPad } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * La entrada del showcase y sus casos, uno debajo del otro (pedido del
   * usuario, 2026-11-25), centrados: el título y una card por caso, sin texto.
   * Es una sola escena que scrollea adentro: los casos pasan 1:1 con el
   * scroll por las franjas de los bordes, que los estiran y los reflejan.
   */
  interface Props {
    width: number
    compact: boolean
    /** Alto de cada franja de los bordes (px CSS): el aire de arriba y de abajo sale de acá. */
    band: number
    /** El look de los bordes: cuándo se enciende el reflejo. */
    look: WarpLook
    /** Dónde queda en la ventana el y 0 del feed: px CSS desde el centro de la ventana, hacia arriba. */
    origin: number
    onmeasure: (height: number) => void
    /** Cuánto se enciende el reflejo de los costados: según cuán centrada está la card más cercana. */
    onfocus: (focus: number) => void
  }

  let { width, compact, band, look, origin, onmeasure, onfocus }: Props = $props()

  /** Del título a la primera card, y de una card a la siguiente (~6 % del ancho de la card). */
  const HEAD_GAP = $derived(compact ? 56 : 80)
  const CASE_GAP = $derived(compact ? 20 : 36)

  const cx = $derived(width / 2)
  const card = $derived(caseCard(width, compact))
  const top = $derived(feedTopPad(band))

  let headHeight = $state(0)

  /** Borde de arriba de la primera card. */
  const first = $derived(-(top + headHeight + HEAD_GAP))
  const count = SHOWCASE.projects.length
  const tops = $derived(SHOWCASE.projects.map((_, i) => first - i * (card.height + CASE_GAP)))

  // El reflejo se enciende cuando un caso pasa por el centro de la ventana.
  const focus = $derived(headHeight === 0 ? 0 : reflectFocus(tops.map((top) => origin + top - card.height / 2), card.height, look))
  $effect(() => onfocus(focus))

  $effect(() => {
    if (headHeight === 0) return
    const bottom = -first + count * card.height + (count - 1) * CASE_GAP
    // Al final del scroll, la última card queda entera arriba de la franja de abajo.
    onmeasure(bottom + Math.max(0, band - SCENE_BOTTOM + 24))
  })
</script>

<T.Group position.y={-top}>
  <SectionHead section={SHOWCASE.section} {width} {compact} size="display" align="center" onmeasure={(h) => (headHeight = h)} />
</T.Group>

{#each SHOWCASE.projects as project, i (project.id)}
  <CaseCard {project} index={i} {cx} y={tops[i]!} cardWidth={card.width} cardHeight={card.height} />
{/each}
