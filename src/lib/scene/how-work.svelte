<script lang="ts">
  import { T } from '@threlte/core'
  import { Rect } from 'essentia-primitives'
  import { Glass } from 'essentia-crystal'
  import { HOW_WORK } from '$lib/content.js'
  import { FIGURE, PALETTE } from '$lib/tokens.js'
  import { howLab } from '$lib/lab/how-lab.svelte.js'
  import { ASPECT } from './figures/how-work.js'
  import type { KitStyle } from './figures/kit.js'
  import { HOW_LOOK, HOW_PLATE, HOW_SHEETS, HOW_SOLID, sheetState, sheetTrack } from './how-work-look.js'
  import InlineHeadline from './inline-headline.svelte'
  import { NAV_SPACE, SCENE_BOTTOM } from './layout.js'
  import LeadInText from './lead-in-text.svelte'
  import SectionHead from './section-head.svelte'
  import StepFigure from './step-figure.svelte'

  /**
   * Cómo trabajamos: las etapas, centradas (DESIGN.md §6). Cada etapa es una
   * figura 3D line art (DESIGN.md §4, `figures/how-work.ts`) que lleva el
   * protagonismo, su título y su texto con lead-in, sin número.
   *
   * Cómo pasa de una etapa a la otra lo dice `how-work-look.ts` (en
   * desarrollo, el banco de pruebas):
   * - De corrido (`flow`): una debajo de la otra; la escena es más alta que la
   *   ventana y se scrollea (scroll interno del deck). Cada etapa aparece con un
   *   fundido al entrar, y un trazo fino une una con la siguiente.
   * - En hojas (`stack`, `glass`): cada etapa es una hoja del alto de la
   *   ventana. El scroll interno primero sube la primera hasta llenar la
   *   ventana; después la escena queda quieta y el resto es un recorrido
   *   (`track` del deck) en el que cada hoja sube desde abajo, 1:1 con el
   *   scroll, y tapa la anterior, que se hunde bajo un velo de tinta.
   */
  interface Props {
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    d: number
    /** Distancia del borde de arriba de la ventana al tope del contenido, en px (crece hacia abajo). */
    top: number
    /** Cuánto va del recorrido de las hojas (0 a lo que pide `ontrack`). */
    slide: number
    /** El movimiento continuo está permitido: las figuras se animan mientras se ven. */
    motion: boolean
    onmeasure: (height: number) => void
    /** El recorrido de las hojas, en px de scroll (0 de corrido). */
    ontrack: (track: number) => void
  }

  let { width, viewportWidth, viewportHeight, compact, top, slide, motion, onmeasure, ontrack }: Props = $props()

  const STEPS = HOW_WORK.steps
  const N = STEPS.length

  // ── Look (en desarrollo, el del banco de pruebas) ──────────────
  const look = $derived(import.meta.env.DEV && howLab ? howLab.look : HOW_LOOK)
  const mode = $derived(import.meta.env.DEV && howLab ? howLab.sheets : HOW_SHEETS)
  const plate = $derived(import.meta.env.DEV && howLab ? howLab.plate : HOW_PLATE)
  const solid = $derived(import.meta.env.DEV && howLab ? howLab.solid : HOW_SOLID)
  const sheeted = $derived(mode !== 'flow')
  const figureStyle = $derived<KitStyle>({ ink: look.ink, stroke: look.stroke, dark: plate === 'dark', solid })
  /** La figura se arma al montar: si cambia cómo se dibuja, se vuelve a montar. */
  const figureKey = $derived(JSON.stringify(figureStyle))

  // ── Medidas (múltiplos de 8) ───────────────────────────────────
  const HEAD_GAP = $derived(compact ? 48 : 72)
  /** Separación entre dos etapas de corrido; el trazo que las une ocupa el medio. */
  const STAGE_GAP = $derived(compact ? 72 : 96)
  const LINK_MARGIN = 16
  const FIGURE_GAP = $derived(compact ? 24 : 32)
  const TITLE_GAP = 16
  const PLATE_RADIUS = 24

  const titleSize = $derived(compact ? 22 : 28)
  const bodySize = $derived(compact ? 17 : 19)

  const cx = $derived(width / 2)
  /** Medida del texto centrado: ~60 caracteres por línea como mucho. */
  const textWidth = $derived(Math.min(width, compact ? 360 : 520))

  let headHeight = $state(0)
  let titleHeights = $state<number[]>(STEPS.map(() => 0))
  let bodyHeights = $state<number[]>(STEPS.map(() => 0))

  const measured = $derived(
    headHeight > 0 && [titleHeights, bodyHeights].every((list) => list.every((h) => h > 0)),
  )
  /** Lo que va debajo de la figura: el espacio, el título y el texto. */
  const textBlocks = $derived(STEPS.map((_, k) => FIGURE_GAP + titleHeights[k]! + TITLE_GAP + bodyHeights[k]!))

  // ── De corrido ─────────────────────────────────────────────────
  /** La figura es lo primero que se lee: ocupa la columna, hasta `figureMax`. */
  const flowFigureWidth = $derived(Math.min(viewportWidth - 32, look.figureMax))
  const flowFigureHeight = $derived(flowFigureWidth / ASPECT)
  const stageTops = $derived.by(() => {
    let y = headHeight + HEAD_GAP
    return textBlocks.map((h) => {
      const at = y
      y += flowFigureHeight + h + STAGE_GAP
      return at
    })
  })
  const flowTotal = $derived(stageTops[N - 1]! + flowFigureHeight + textBlocks[N - 1]!)

  // ── En hojas ───────────────────────────────────────────────────
  /** Alto de una hoja: la ventana. */
  const S = $derived(viewportHeight)
  /** Lo que queda bajo la navbar y sobre el pie de la escena. */
  const room = $derived(S - NAV_SPACE - SCENE_BOTTOM)
  /** Todas las figuras del mismo tamaño: el de `figureHeight`, si entra con el texto más largo. */
  const sheetFigureHeight = $derived.by(() => {
    const fits = room - Math.max(...textBlocks)
    const h = Math.max(96, Math.min(look.figureHeight * S, fits))
    return Math.min(h, (viewportWidth - 32) / ASPECT)
  })
  const sheetFigureWidth = $derived(sheetFigureHeight * ASPECT)
  /** Tope de la primera hoja en el contenido: debajo del encabezado. */
  const sheetTop = $derived(headHeight + HEAD_GAP)
  /**
   * El alto que se informa: la hoja termina `SCENE_BOTTOM` por debajo del
   * borde de la escena, así con todo el scroll interno su tope queda en el de
   * la ventana (`sceneFrame`).
   */
  const sheetTotal = $derived(sheetTop + S - SCENE_BOTTOM)
  const hold = $derived(look.hold * S)
  const track = $derived(sheeted ? sheetTrack(N, S, hold) : 0)
  const sheet = $derived(sheetState(slide, N, S, hold))
  /** Tope del bloque (figura y texto) dentro de su hoja: centrado bajo la navbar. */
  const blockTop = (k: number) => NAV_SPACE + Math.max(0, (room - sheetFigureHeight - textBlocks[k]!) / 2)

  $effect(() => {
    if (!measured) return
    onmeasure(sheeted ? sheetTotal : flowTotal)
    ontrack(track)
  })

  // ── Fundido al entrar (de corrido) ─────────────────────────────
  // Una etapa empieza a aparecer cuando su tope cruza el 90 % de la ventana y
  // está entera al subir otro 30 %. Al volver hacia arriba se va igual.
  const REVEAL_FROM = 0.9
  const REVEAL_SPAN = 0.3
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const reveal = (k: number) =>
    measured ? clamp01((viewportHeight * REVEAL_FROM - (top + stageTops[k]!)) / (viewportHeight * REVEAL_SPAN)) : 0
  /** La figura de la etapa de corrido está en la ventana (solo entonces se anima). */
  const onScreen = (k: number) => top + stageTops[k]! < viewportHeight && top + stageTops[k]! + flowFigureHeight > 0

  // ── Hojas: qué se ve ───────────────────────────────────────────
  /** La hoja que sube, o -1. */
  const rising = $derived(sheet.rise > 0 && sheet.base < N - 1 ? sheet.base + 1 : -1)
  /** Tope de la hoja `k` en el contenido: la de arriba quieta, la que sube desde abajo. */
  const sheetY = (k: number) => sheetTop + (k === rising ? (1 - sheet.rise) * S : 0)
  /** La hoja de atrás, mientras la tapan: se hunde (sin movimiento, no). */
  const sinkScale = $derived(motion ? 1 - (1 - look.sink) * sheet.rise : 1)
  /** El contenido de la hoja de vidrio aparece mientras sube. */
  const glassContent = $derived(mode === 'glass' ? clamp01((sheet.rise - 0.25) / 0.6) : 1)
  /** La hoja `k` está en la ventana (para animar su figura): la de arriba siempre que la escena se vea. */
  const sheetOnScreen = (k: number) => top + sheetY(k) < viewportHeight && top + sheetY(k) + S > 0
</script>

<!-- Placa detrás de la figura: blanca con borde y sombra, u oscura. -->
{#snippet figurePlate(x: number, y: number, w: number, h: number, z: number, opacity: number)}
  {#if plate !== 'none' && opacity > 0}
    {@const pw = w + look.platePad * 2}
    {@const ph = h + look.platePad * 2}
    {#if plate === 'light'}
      <Rect width={pw} height={ph} radius={PLATE_RADIUS} color={PALETTE.ink} opacity={0.08 * opacity} softness={36} {x} y={y - 10} z={z - 0.003} />
      <Rect width={pw + 2} height={ph + 2} radius={PLATE_RADIUS + 1} color={PALETTE.ink} opacity={0.08 * opacity} {x} {y} z={z - 0.002} />
      <Rect width={pw} height={ph} radius={PLATE_RADIUS} color={PALETTE.paper} {opacity} {x} {y} z={z - 0.001} />
    {:else}
      <Rect width={pw} height={ph} radius={PLATE_RADIUS} color={PALETTE.brandDeep} {opacity} {x} {y} z={z - 0.001} />
    {/if}
  {/if}
{/snippet}

<!-- Una etapa: la figura arriba y el texto debajo, con el tope de la figura en `y0` (y hacia arriba). -->
{#snippet step(k: number, y0: number, figureWidth: number, figureHeight: number, z: number, opacity: number, lensOpacity: number, playing: boolean)}
  {@const item = STEPS[k]!}
  {@const titleY = y0 - figureHeight - FIGURE_GAP}
  {#if measured}
    {@render figurePlate(cx, y0 - figureHeight / 2, figureWidth, figureHeight, z + 0.01, opacity)}
    {#key figureKey}
      <StepFigure
        index={k}
        width={figureWidth}
        x={cx}
        y={y0 - figureHeight / 2}
        z={z + 0.02}
        {opacity}
        {lensOpacity}
        {playing}
        style={figureStyle}
      />
    {/key}
  {/if}
  <InlineHeadline
    text={item.title}
    fontSize={titleSize}
    lineHeight={1.2}
    letterSpacing={-titleSize * 0.01}
    maxWidth={textWidth}
    x={cx}
    y={titleY}
    z={z + 0.03}
    {opacity}
    onmeasure={(_, h) => (titleHeights[k] = h)}
  />
  <LeadInText
    text={item.body}
    fontSize={bodySize}
    lineHeight={1.55}
    maxWidth={textWidth}
    alignment="center"
    anchorX={0.5}
    x={cx}
    y={titleY - titleHeights[k]! - TITLE_GAP}
    z={z + 0.03}
    {opacity}
    onmeasure={(_, h) => (bodyHeights[k] = h)}
  />
{/snippet}

<SectionHead section={HOW_WORK.section} {width} {compact} align="center" onmeasure={(h) => (headHeight = h)} />

{#if !sheeted}
  {#each STEPS as item, k (item.title)}
    {@const opacity = reveal(k)}
    {@const y0 = -(stageTops[k] ?? 0)}

    {#if measured && k > 0}
      <!-- Trazo que une esta etapa con la anterior: aparece con ella. -->
      {@const length = STAGE_GAP - LINK_MARGIN * 2}
      <Rect
        width={FIGURE.strokeWidth}
        height={length}
        radius={0}
        color={FIGURE.stroke}
        opacity={FIGURE.strokeOpacity * opacity}
        x={cx}
        y={y0 + LINK_MARGIN + length / 2}
      />
    {/if}
    {@render step(k, y0, flowFigureWidth, flowFigureHeight, 0, opacity, opacity, motion && onScreen(k))}
  {/each}
{:else}
  {#each STEPS as item, k (item.title)}
    {@const isBase = k === sheet.base}
    {@const isRising = k === rising}
    {@const y = -sheetY(k)}
    {@const centerY = y - S / 2}
    {@const y0 = y - blockTop(k)}
    {@const z = isRising ? (mode === 'glass' ? 1.1 : 0.5) : 0}
    {@const scale = isBase ? sinkScale : 1}
    <!-- Las hojas que no se ven se montan igual (quedan medidas), sin dibujarse. El contenido va siempre en el mismo lugar del árbol: al pasar de subir a quedar arriba no se vuelve a montar. -->
    <T.Group visible={isBase || isRising}>
      {#if isRising && mode === 'stack'}
        <!-- La hoja que sube: papel con las esquinas de arriba redondeadas y una sombra sobre su borde. -->
        <Rect
          width={viewportWidth}
          height={S}
          radius={look.radius}
          color={PALETTE.ink}
          opacity={look.shadow}
          softness={look.shadowSpread}
          x={cx}
          y={centerY + look.shadowSpread * 0.35}
          z={0.45}
        />
        <Rect width={viewportWidth} height={S + look.radius} radius={look.radius} color={PALETTE.paper} x={cx} y={centerY - look.radius / 2} z={0.5} />
      {:else if isRising}
        <!-- La hoja de vidrio: esmerila la de atrás y se vuelve papel al llegar arriba. -->
        <Glass
          width={viewportWidth}
          height={S + look.radius}
          radius={look.radius}
          blur={look.glassBlur}
          refraction={look.glassRefraction * (1 - sheet.rise)}
          dispersion={0.04 * (1 - sheet.rise)}
          tint={PALETTE.paper}
          tintOpacity={look.glassTint + (1 - look.glassTint) * sheet.rise * sheet.rise}
          specular={0.3 * (1 - sheet.rise)}
          rim={0.12 * (1 - sheet.rise)}
          shadowOpacity={look.shadow}
          shadowSpread={look.shadowSpread * 0.5}
          shadowOffsetY={0}
          x={cx}
          y={centerY - look.radius / 2}
          z={1}
        />
      {/if}
      <!-- La hoja de arriba, mientras la tapan, se hunde bajo un velo de tinta (sin movimiento, no se achica). -->
      <T.Group position.x={cx} position.y={centerY} scale.x={scale} scale.y={scale}>
        <T.Group position.x={-cx} position.y={-centerY}>
          {@render step(
            k,
            y0,
            sheetFigureWidth,
            sheetFigureHeight,
            z,
            isRising ? glassContent : 1,
            isRising ? 0 : 1 - clamp01(sheet.rise * 4),
            motion && (isBase || isRising) && sheetOnScreen(k),
          )}
          {#if isBase && sheet.rise > 0}
            <Rect width={viewportWidth} height={S} radius={look.radius} color={PALETTE.ink} opacity={look.veil * sheet.rise} x={cx} y={centerY} z={0.4} />
          {/if}
        </T.Group>
      </T.Group>
    </T.Group>
  {/each}
{/if}
