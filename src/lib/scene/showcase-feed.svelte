<script lang="ts">
  import { T } from '@threlte/core'
  import { HERO, SHOWCASE, caseHref, type Project } from '$lib/content.js'
  import type { ScreenRect } from './case-transition.js'
  import CaseCard from './case-card.svelte'
  import { reflectFocus, type WarpLook } from './edge-warp.js'
  import { widestHeadline } from './headline.js'
  import RotatingHeadline from './rotating-headline.svelte'
  import { CASE_LOOK, NAV_SPACE, SCENE_BOTTOM, caseCard, caseTrack, heroLayout, showcaseIntro } from './layout.js'
  import { lab } from '$lib/lab/warp-lab.svelte.js'

  /**
   * La entrada del showcase, como el hero de la home (pedido del usuario,
   * 2026-11-25): el título grande arriba y, en lugar de la figura, los casos,
   * que arrancan por debajo de la mitad de la ventana, cortados por el borde de abajo. El
   * scroll primero sube todo (el scroll interno vertical): el título se va
   * por arriba y las cards, del tamaño de la ventana, la llenan. Después las
   * corre de derecha a izquierda (el recorrido horizontal), una card por
   * caso, sin texto, de la primera centrada a la última; las vecinas asoman
   * por los costados, donde las franjas de los bordes las estiran.
   */
  interface Props {
    /** Ancho de la columna: su centro es el de la ventana. */
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    /** Tamaño de las franjas de los costados (px): la card centrada y el título quedan afuera. */
    band: number
    /** El look de los bordes: cuándo se enciende el reflejo. */
    look: WarpLook
    /** Corrimiento de la escena en escenas (0 = en pantalla): el reflejo se apaga al salir. */
    d: number
    /** Cuánto del recorrido horizontal va (px). */
    slide: number
    /** Cuánto del scroll vertical va (0 a 1): el título se apaga mientras se va. */
    reveal: number
    /** Alto del contenido, largo del recorrido horizontal y de una card a la siguiente (px). */
    onmeasure: (height: number, track: number, step: number) => void
    /** La palabra del título rota. */
    motion: boolean
    /** El link con el foco en la capa semántica: la card de ese caso lleva el anillo. */
    focusedHref: string | null
    /** La y en la ventana (origen en el centro, hacia arriba) del tope del contenido: dónde está cada card. */
    originY: number
    /** Click en una card: la transición a la página del caso, desde donde está la card. */
    onopencase: (project: Project, index: number, href: string, from: ScreenRect) => void
    /** Cuánto se enciende el reflejo: según cuán centrada está la card más cercana. */
    onfocus: (focus: number) => void
    /** La card que trae la transición al volver de su caso: no se dibuja, e informa dónde queda. */
    landingCase: number | null
    onanchor: (rect: ScreenRect) => void
  }

  let { width, viewportWidth, viewportHeight, compact, band, look, d, slide, reveal, motion, focusedHref, originY, onopencase, onmeasure, onfocus, landingCase, onanchor }: Props = $props()

  /** El tamaño de las cards: en desarrollo, el del banco de pruebas (`$lib/lab`). */
  const cases = $derived(import.meta.env.DEV && lab ? lab.cases : CASE_LOOK)

  /** El título, al tamaño del titular del hero de la home y animado como él (pedidos del usuario, 2026-11-25). */
  const hero = $derived(heroLayout(width, viewportHeight, compact, widestHeadline(HERO.headline)))

  /** De una card a la siguiente. */
  const CASE_GAP = $derived(compact ? cases.compactGap : cases.gap)

  const count = SHOWCASE.projects.length
  const cx = $derived(width / 2)

  let headHeight = $state(0)

  /** Las cards llenan la ventana entre la navbar y el pie de la escena: así quedan cuando el título se fue. */
  const available = $derived(viewportHeight - NAV_SPACE - SCENE_BOTTOM)
  const card = $derived(caseCard(viewportWidth, available, compact, band, cases))
  /** El título arriba, las cards desde `cases.start` de la ventana, y el aire que las centra al final. */
  const intro = $derived(showcaseIntro(viewportHeight, headHeight, card.height, cases.start))
  /** El título se apaga mientras sube: al final del scroll vertical no queda nada de él bajo la navbar. */
  const headOpacity = $derived.by(() => {
    const t = Math.min(1, Math.max(0, (reveal - 0.15) / 0.7))
    return 1 - t * t * (3 - 2 * t)
  })
  /** El título, centrado y afuera de las franjas de los costados. */
  const headWidth = $derived(Math.min(width, viewportWidth - 2 * (band + 12)))
  const step = $derived(card.width + CASE_GAP)
  const track = $derived(caseTrack(count, card.width, CASE_GAP))

  /** Distancia de cada card al centro de la ventana (px, + a la derecha). */
  const offsets = $derived(SHOWCASE.projects.map((_, i) => i * step - slide))

  $effect(() => {
    if (headHeight === 0) return
    onmeasure(intro.height, track, step)
  })

  // El reflejo se enciende cuando un caso pasa por el centro de la ventana, y
  // se apaga cuando la escena se va (al cierre).
  const presence = $derived.by(() => {
    const t = Math.min(1, Math.abs(d) / 0.5)
    return 1 - t * t * (3 - 2 * t)
  })
  const focus = $derived(headHeight === 0 ? 0 : reflectFocus(offsets, card.width, look) * presence)
  $effect(() => onfocus(focus))

  /** Dónde está la card `i` en la ventana: de dónde sale la transición al abrirla, y adónde llega al volver. */
  const rectOf = (i: number): ScreenRect => ({
    x: offsets[i]!,
    y: originY - intro.cardTop - card.height / 2,
    width: card.width,
    height: card.height,
  })

  $effect(() => {
    if (landingCase !== null && headHeight > 0) onanchor(rectOf(landingCase))
  })
</script>

<T.Group position.x={(width - headWidth) / 2} position.y={-intro.titleTop}>
  <RotatingHeadline
    title={SHOWCASE.headline}
    fontSize={hero.titleSize}
    maxWidth={Math.min(headWidth, hero.textWidth)}
    x={headWidth / 2}
    opacity={headOpacity}
    {motion}
    {compact}
    onmeasure={(h) => (headHeight = h)}
  />
</T.Group>

<T.Group position.y={-intro.cardTop}>
  {#each SHOWCASE.projects as project, i (project.id)}
    {@const href = caseHref(project.id)}
    {#if i !== landingCase}
      <CaseCard
        {project}
        index={i}
        cx={cx + offsets[i]!}
        y={0}
        cardWidth={card.width}
        cardHeight={card.height}
        focused={focusedHref === href}
        onopen={() => onopencase(project, i, href, rectOf(i))}
      />
    {/if}
  {/each}
</T.Group>
