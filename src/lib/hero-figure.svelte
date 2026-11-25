<script lang="ts">
  import { FIGURE, PALETTE } from '$lib/tokens.js'
  import { DESIGN_HEIGHT, DESIGN_WIDTH, HERO_FIGURES, LOOK } from '$lib/scene/figures/hero.js'

  /**
   * La figura del hero en la capa semántica: la misma que dibuja la escena
   * (`scene/figures/hero.ts`), en SVG y quieta en la primera, con la misma
   * escala y corrimiento en el marco y el difuminado de abajo (aproximado con
   * un degradé de máscara). Es decorativa: el titular ya dice lo mismo.
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
  <defs>
    <radialGradient id="hero-figure-shadow">
      <stop offset="0" stop-color={FIGURE.stroke} stop-opacity="0.09" />
      <stop offset="1" stop-color={FIGURE.stroke} stop-opacity="0" />
    </radialGradient>
  </defs>
  <g transform="scale({LOOK.scale}) translate(0 {LOOK.offsetY})">
  {#each dots as d (`${d.x},${d.y}`)}
    <circle cx={d.x} cy={d.y} r={1 / LOOK.scale} fill={FIGURE.stroke} fill-opacity={d.o} />
  {/each}
  {#each figure.shapes as s, i (i)}
    <!-- Un relleno es el papel con la tinta encima: tapa lo que tiene debajo. -->
    {#if s.kind === 'shadow'}
      <ellipse cx={s.x} cy={s.y} rx={s.w / 2} ry={s.h / 2} fill="url(#hero-figure-shadow)" />
    {:else if s.kind === 'rect'}
      {#if s.fill !== undefined}
        <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.r, s.w / 2, s.h / 2)} fill={PALETTE.paper} />
        <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.r, s.w / 2, s.h / 2)} fill={FIGURE.stroke} fill-opacity={s.fill} />
      {/if}
      {#if !s.bare}
        <rect x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={s.r} fill="none" {...stroke(s)} />
      {/if}
    {:else if s.kind === 'circle'}
      {#if s.fill !== undefined}
        <circle cx={s.x} cy={s.y} r={s.r} fill={PALETTE.paper} />
        <circle cx={s.x} cy={s.y} r={s.r} fill={FIGURE.stroke} fill-opacity={s.fill} />
      {/if}
      {#if !s.bare}
        <circle cx={s.x} cy={s.y} r={s.r} fill="none" {...stroke(s)} />
      {/if}
    {:else if s.closed}
      {#if s.fill !== undefined}
        <polygon points={points(s.points)} fill={PALETTE.paper} />
        <polygon points={points(s.points)} fill={FIGURE.stroke} fill-opacity={s.fill} />
      {/if}
      {#if !s.bare}
        <polygon points={points(s.points)} fill="none" {...stroke(s)} />
      {/if}
    {:else}
      <polyline points={points(s.points)} fill="none" {...stroke(s)} />
    {/if}
  {/each}
  </g>
</svg>
