<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { Glass } from 'essentia-crystal'
  import { CONTACT_SECTION, SITES } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import Closing from './closing.svelte'
  import Delivery from './delivery.svelte'
  import Footer from './footer.svelte'
  import Hero from './hero.svelte'
  import { bob, columnWidth, isCompact, medusas, sectionGap, stack, type MedusaRect } from './layout.js'
  import Nav from './nav.svelte'
  import Ocean from './ocean.svelte'
  import Problems from './problems.svelte'
  import type { ScrollState } from './scroll.svelte.js'

  interface Props {
    scroll: ScrollState
    /** El movimiento continuo (medusas, haces, nieve) está permitido. */
    motion: boolean
    focusedHref: string | null
    year: number
    /** Tope de cada sección (en el orden de `SECTION_IDS`) cuando cambia el layout. */
    onlayout: (tops: readonly number[]) => void
    onnavigate: (href: string) => void
  }

  let { scroll, motion, focusedHref, year, onlayout, onnavigate }: Props = $props()

  const engine = useEngine()

  const vw = $derived(engine.viewport.width)
  const vh = $derived(engine.viewport.height)
  const compact = $derived(isCompact(vw))
  const width = $derived(columnWidth(vw))

  // ── Apilado ────────────────────────────────────────────────────
  // hero, qué resolvemos, cómo entregamos, sites, contacto, pie
  let heights = $state([0, 0, 0, 0, 0, 0])
  const layout = $derived(stack(heights, sectionGap(vw)))
  const ready = $derived(heights.every((h) => h > 0))

  $effect(() => {
    if (!ready) return
    scroll.setMax(layout.total - vh)
    onlayout(layout.tops)
  })

  // ── Reloj ──────────────────────────────────────────────────────
  // Corre solo mientras el hero está en pantalla y el movimiento está
  // permitido: más abajo la escena vuelve a dibujarse solo al scrollear.
  const heroHeight = $derived(heights[0] || vh)
  let time = $state(0)
  const running = $derived(motion && scroll.offset < heroHeight)
  useTask((delta) => (time += delta), { running: () => running })
  useTask((delta) => scroll.step(delta), { running: () => scroll.moving })

  // ── Medusas ────────────────────────────────────────────────────
  const GLOW = { accent: PALETTE.accent, glow: PALETTE.glow } as const
  const list = $derived(medusas(width, heroHeight, compact))
  const placed = $derived(
    list.map((m) => {
      const { dx, dy } = bob(m, time)
      return { ...m, x: m.x + dx, y: m.y + dy }
    }),
  )
  /** En pantalla, para el fondo: la página sube con el scroll. */
  const onScreen = $derived<MedusaRect[]>(
    placed.map((m) => ({
      x: -width / 2 + m.x,
      y: vh / 2 + scroll.offset + m.y,
      width: m.width,
      height: m.height,
      color: GLOW[m.tint],
    })),
  )
</script>

<Ocean scroll={scroll.offset} {time} medusas={onScreen} />

<!-- ── Capas (z) y niveles de captura ───────────────────────────
  -1    fondo marino (fijo a la ventana)
   0    texto y líneas del contenido
   1    vidrios del contenido: medusas, botones y paneles → nivel 1
   1.01 texto sobre los paneles
  10    navbar fija → nivel 2
-->
<!-- Hasta medir todo, las secciones estarían encimadas en el tope: la página aparece entera. -->
<T.Group position.x={-width / 2} position.y={vh / 2 + scroll.offset} visible={ready}>
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

  <T.Group position.y={-(layout.tops[0] ?? 0)}>
    <Hero {width} viewportHeight={vh} {compact} {focusedHref} onmeasure={(h) => (heights[0] = h)} {onnavigate} />
  </T.Group>
  <T.Group position.y={-(layout.tops[1] ?? 0)}>
    <Problems {width} {compact} onmeasure={(h) => (heights[1] = h)} />
  </T.Group>
  <T.Group position.y={-(layout.tops[2] ?? 0)}>
    <Delivery {width} {compact} onmeasure={(h) => (heights[2] = h)} />
  </T.Group>
  <T.Group position.y={-(layout.tops[3] ?? 0)}>
    <Closing section={SITES.section} secondary={SITES.action} {width} {compact} {focusedHref} onmeasure={(h) => (heights[3] = h)} {onnavigate} />
  </T.Group>
  <T.Group position.y={-(layout.tops[4] ?? 0)}>
    <Closing
      section={CONTACT_SECTION.section}
      primary={CONTACT_SECTION.primary}
      secondary={CONTACT_SECTION.secondary}
      {width}
      {compact}
      {focusedHref}
      onmeasure={(h) => (heights[4] = h)}
      {onnavigate}
    />
  </T.Group>
  <T.Group position.y={-(layout.tops[5] ?? 0)}>
    <Footer {width} {compact} {year} onmeasure={(h) => (heights[5] = h)} />
  </T.Group>
</T.Group>

<Nav {width} {compact} {focusedHref} {onnavigate} />
