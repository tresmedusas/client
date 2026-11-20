<script lang="ts">
  import { useTask } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { HERO } from '$lib/content.js'
  import type { Deck } from './deck.svelte.js'
  import HomeScene from './home-scene.svelte'
  import { bob, columnWidth, heroLayout, isCompact, type MedusaRect } from './layout.js'
  import Nav from './nav.svelte'
  import Backdrop from './backdrop.svelte'
  import EdgeWarp from './edge-warp.svelte'
  import SceneDots from './scene-dots.svelte'
  import ShowcaseScene from './showcase-scene.svelte'

  interface Props {
    deck: Deck
    /** Qué página se dibuja. */
    page: 'home' | 'showcase'
    /** El movimiento continuo (medusas, haces, nieve) está permitido. */
    motion: boolean
    focusedHref: string | null
    activeHref: string | null
    year: number
    onnavigate: (href: string) => void
    /** Click en una marca del indicador de escenas. */
    onselect: (index: number) => void
  }

  let { deck, page, motion, focusedHref, activeHref, year, onnavigate, onselect }: Props = $props()

  const engine = useEngine()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)
  const compact = $derived(isCompact(vw))
  const width = $derived(columnWidth(vw))

  $effect(() => deck.setViewport(vh))

  // ── Reloj ──────────────────────────────────────────────────────
  // Corre solo mientras el hero está en pantalla y el movimiento está
  // permitido: en las demás escenas la escena se dibuja solo en las transiciones.
  const home = $derived(page === 'home')
  let time = $state(0)
  const running = $derived(motion && home && deck.position < 1)
  useTask((delta) => (time += delta), { running: () => running })
  useTask((delta) => deck.advance(delta), { running: () => deck.moving })

  // ── Medusas del hero ───────────────────────────────────────────
  // Impresas en el papel (las dibuja el fondo) debajo del texto del hero.
  // Cada una flota a su ritmo y se va con el hero según su distancia: la
  // principal, un poco más rápido que él (está más cerca). En el showcase no hay.
  const medusas = $derived.by<MedusaRect[]>(() => {
    if (!home || deck.position >= 1.2) return []
    return heroLayout(width, vh, compact, HERO.title).medusas.map((m) => {
      const { dx, dy } = bob(m.height, time + m.phase)
      return { ...m, x: m.x + dx, y: m.y + dy + deck.shift(0) * m.parallax }
    })
  })
</script>

<Backdrop {time} {medusas} />

<!-- ── Capas (z) y niveles de captura ───────────────────────────
  -1    fondo: papel liso y las medusas del hero (fijo a la ventana)
   0    texto, líneas y placas del contenido
   1    vidrios del contenido: botones, paneles y lentes → nivel 1
   1.01 texto sobre los paneles
   9.9995 bordes de arriba y abajo: curva, aberración, blur y líquido → nivel 2 (con la navbar)
  10    navbar fija → nivel 2; indicador de escenas
  11    lente del link activo de la navbar → nivel 3 (el último)
-->
{#key page}
  {#if home}
    <HomeScene {deck} {width} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} {motion} />
  {:else}
    <ShowcaseScene {deck} {width} viewportWidth={vw} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} />
  {/if}
{/key}

<!-- La fase del líquido sigue al contenido: el paso de escena, el scroll interno y el reloj del hero. -->
<EdgeWarp phase={time * 0.6 + deck.position * 2.4 + deck.innerOf(deck.index) * 0.012} />

<Nav {width} {compact} {focusedHref} {activeHref} {onnavigate} />
{#if !compact && deck.count > 1}
  <SceneDots count={deck.count} position={deck.position} x={vw / 2 - 22} {onselect} />
{/if}
