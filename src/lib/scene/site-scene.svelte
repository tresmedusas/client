<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { PALETTE } from '$lib/tokens.js'
  import type { Deck } from './deck.svelte.js'
  import HomeScene from './home-scene.svelte'
  import { bob, columnWidth, isCompact, medusas, type MedusaRect } from './layout.js'
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

  // ── Logo de la navbar ──────────────────────────────────────────
  // Mientras se ve el hero, que ya presenta la marca, la navbar va sin logo:
  // aparece a medida que el hero se va (posición 0.3 → 0.8).
  const navLogo = $derived.by(() => {
    if (!home) return 1
    const t = Math.min(1, Math.max(0, (deck.position - 0.3) / 0.5))
    return t * t * (3 - 2 * t)
  })

  // ── Medusas del hero ───────────────────────────────────────────
  // Flotan sobre el título y se van con el hero, un poco más rápido que él
  // (están más cerca). En el showcase no hay.
  const GLOW = { brand: PALETTE.brand, light: PALETTE.brandLight } as const
  const list = $derived(home ? medusas(width, vh, compact) : [])
  const placed = $derived(
    list.map((m) => {
      const { dx, dy } = bob(m, time)
      return { ...m, x: -width / 2 + m.x + dx, y: vh / 2 + m.y + dy + deck.shift(0) * 1.25 }
    }),
  )
  const onScreen = $derived<MedusaRect[]>(placed.map((m) => ({ x: m.x, y: m.y, width: m.width, height: m.height, color: GLOW[m.tint] })))
</script>

<Backdrop {time} medusas={onScreen} />

<!-- ── Capas (z) y niveles de captura ───────────────────────────
  -1    fondo: papel liso (fijo a la ventana)
   0    texto, líneas y placas del contenido
   1    vidrios del contenido: medusas, botones, paneles y lentes → nivel 1
   1.01 texto sobre los paneles
   9.9995 bordes de arriba y abajo: curva, aberración, blur y líquido → nivel 2 (con la navbar)
  10    navbar fija (sus gotas de vidrio) → nivel 2; indicador de escenas
  11    libre: el nivel 3, el último que soporta Glass
-->
{#if home && deck.position < 1.2}
  <T.Group>
    {#each placed as m, i (i)}
      <Glass
        preset="lens"
        width={m.width}
        height={m.height}
        radius={m.height / 2}
        magnify={1.18}
        dispersion={0.12}
        tint={GLOW[m.tint]}
        tintOpacity={0.1}
        specular={0.55}
        rim={0.3}
        shadowOpacity={0}
        wobble={{ amplitude: 0.09, frequency: 0.55, phase: time * 0.45 + m.phase }}
        x={m.x}
        y={m.y}
        z={1}
      />
    {/each}
  </T.Group>
{/if}

{#key page}
  {#if home}
    <HomeScene {deck} {width} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} {motion} />
  {:else}
    <ShowcaseScene {deck} {width} viewportWidth={vw} viewportHeight={vh} {compact} {year} {focusedHref} {onnavigate} />
  {/if}
{/key}

<!-- La fase del líquido sigue al contenido: el paso de escena, el scroll interno y el reloj del hero. -->
<EdgeWarp phase={time * 0.6 + deck.position * 2.4 + deck.innerOf(deck.index) * 0.012} />

<Nav {width} {compact} logo={navLogo} {focusedHref} {activeHref} {onnavigate} />
{#if !compact && deck.count > 1}
  <SceneDots count={deck.count} position={deck.position} x={vw / 2 - 22} {onselect} />
{/if}
