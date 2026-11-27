<script lang="ts">
  import { FIGURE, PALETTE } from '$lib/tokens.js'
  import {
    DESIGN_HEIGHT,
    DESIGN_WIDTH,
    HERO_FIGURES,
    LOOK,
    obliqueOffset,
    outlineOf,
    stack,
    sweep,
    type Shape,
  } from '$lib/scene/figures/hero.js'

  /**
   * La figura del hero en la capa semántica: la misma que dibuja la escena
   * (`scene/figures/hero.ts`), en SVG y quieta en la primera, con la misma
   * escala y corrimiento en el marco y el difuminado de abajo (aproximado con
   * un degradé de máscara). Es decorativa: el titular ya dice lo mismo.
   *
   * El volumen sale del mismo apilado (`stack`) y de la misma oblicua
   * (`obliqueOffset`): cada volumen es su lado (lo que barre el contorno al
   * subir, en un solo tono: el de los lados que se ven en la escena según el
   * ángulo, entre el 5 % de los que miran a un costado y el 9 % de los de abajo),
   * el contorno de abajo y la cara de arriba. Se dibuja de abajo hacia arriba.
   */
  interface Props {
    index?: number
  }

  let { index = 0 }: Props = $props()

  const figure = $derived(HERO_FIGURES[index]!)
  const W = DESIGN_WIDTH
  const H = DESIGN_HEIGHT

  /** Puntos de la grilla, cada `FIGURE.gridStep`, que se desvanecen hacia afuera. */
  const R = 250
  const dots: { x: number; y: number; o: number }[] = []
  for (let x = -R; x <= R; x += FIGURE.gridStep) {
    for (let y = -R; y <= R; y += FIGURE.gridStep) {
      const d = Math.hypot(x, y) / R
      if (d <= 1) dots.push({ x, y, o: FIGURE.gridOpacity * 1.6 * (1 - d * d) })
    }
  }

  const stroke = (s: { strong?: boolean }) => ({
    stroke: FIGURE.stroke,
    'stroke-opacity': s.strong ? FIGURE.strokeStrongOpacity : FIGURE.strokeOpacity,
    'stroke-width': s.strong ? FIGURE.strokeStrongWidth : FIGURE.strokeWidth,
    'vector-effect': 'non-scaling-stroke',
  })
  const points = (ps: [number, number][]) => ps.map(([x, y]) => `${x},${y}`).join(' ')

  /** El tono del lado de un volumen: con la oblicua hacia arriba (90°) se ven solo los de abajo, al 9 %. */
  const SIDE = 0.05 + 0.04 * Math.sin((LOOK.obliqueAngle * Math.PI) / 180) ** 2
  const layers = $derived.by(() => {
    const levels = stack(figure.shapes, LOOK)
    return figure.shapes
      .map((s, i) => {
        const { base, lift } = levels[i]!
        const below = obliqueOffset(base, LOOK)
        const top = obliqueOffset(base + lift, LOOK)
        const side = lift > 0 ? sweep(outlineOf(s), [top[0] - below[0], top[1] - below[1]]) : null
        return { s, i, base, lift, below, top, side }
      })
      .sort((a, b) => a.base - b.base || a.i - b.i)
  })
  const grid = obliqueOffset(0, LOOK)

  /** El difuminado de abajo como máscara: la misma curva que el shader de la escena, en tramos. */
  const mask = (() => {
    const stops: string[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const a = Math.pow(t * t * (3 - 2 * t), LOOK.bottomCurve)
      stops.unshift(`rgb(0 0 0 / ${a.toFixed(3)}) ${((1 - t * LOOK.bottomFade) * 100).toFixed(1)}%`)
    }
    return `linear-gradient(to bottom, ${stops.join(', ')})`
  })()
</script>

<!-- Una forma: su relleno (el papel con la tinta encima, que tapa lo de debajo) y su trazo. -->
{#snippet shape(s: Shape, fill: number | undefined, stroked: boolean)}
  {#if s.kind === 'rect'}
    {#if fill !== undefined}
      <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.r, s.w / 2, s.h / 2)} fill={PALETTE.paper} />
      <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.r, s.w / 2, s.h / 2)} fill={FIGURE.stroke} fill-opacity={fill} />
    {/if}
    {#if stroked}
      <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={s.r} fill="none" {...stroke(s)} />
    {/if}
  {:else if s.kind === 'circle'}
    {#if fill !== undefined}
      <circle cx={s.x} cy={s.y} r={s.r} fill={PALETTE.paper} />
      <circle cx={s.x} cy={s.y} r={s.r} fill={FIGURE.stroke} fill-opacity={fill} />
    {/if}
    {#if stroked}
      <circle cx={s.x} cy={s.y} r={s.r} fill="none" {...stroke(s)} />
    {/if}
  {:else if s.closed}
    {#if fill !== undefined}
      <polygon points={points(s.points)} fill={PALETTE.paper} />
      <polygon points={points(s.points)} fill={FIGURE.stroke} fill-opacity={fill} />
    {/if}
    {#if stroked}
      <polygon points={points(s.points)} fill="none" {...stroke(s)} />
    {/if}
  {:else if stroked}
    <polyline points={points(s.points)} fill="none" {...stroke(s)} />
  {/if}
{/snippet}

<svg
  class="hero-figure"
  viewBox="{-W / 2} {-H / 2} {W} {H}"
  width={W}
  height={H}
  style:mask-image={mask}
  style:-webkit-mask-image={mask}
  aria-hidden="true"
  focusable="false"
>
  <g transform="scale({LOOK.scale}) translate(0 {LOOK.offsetY})">
  <g transform="translate({grid[0]} {grid[1]})">
  {#each dots as d (`${d.x},${d.y}`)}
    <circle cx={d.x} cy={d.y} r={1 / LOOK.scale} fill={FIGURE.stroke} fill-opacity={d.o} />
  {/each}
  </g>
  {#each layers as l (l.i)}
    {#if l.side}
      <g transform="translate({l.below[0]} {l.below[1]})">
        <polygon points={points(l.side)} fill={PALETTE.paper} />
        <polygon points={points(l.side)} fill={FIGURE.stroke} fill-opacity={SIDE} />
        {@render shape(l.s, undefined, true)}
      </g>
      <g transform="translate({l.top[0]} {l.top[1]})">{@render shape(l.s, l.s.fill ?? 0, true)}</g>
    {:else}
      <g transform="translate({l.below[0]} {l.below[1]})">{@render shape(l.s, l.s.fill, !l.s.bare)}</g>
    {/if}
  {/each}
  </g>
</svg>
