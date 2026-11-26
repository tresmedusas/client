<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import type { Project } from '$lib/content.js'
  import { FIGURE, PALETTE } from '$lib/tokens.js'
  import Preview from './preview.svelte'
  import { testPreview } from '$lib/lab/warp-lab.js'
  import { lab } from '$lib/lab/warp-lab.svelte.js'

  /**
   * Un caso del showcase: la card con su previsualización (una captura o una
   * imagen, en un marco de radio 16 con borde de 1 px de tinta, DESIGN.md §4),
   * sin texto (pedido del usuario, 2026-11-25). Con `onopen`, la card se
   * puede clickear: abre la página del caso. Con el foco del teclado en su
   * link de la capa semántica, lleva el anillo de foco.
   */
  interface Props {
    project: Project
    /** Lugar en la lista: elige la previsualización de prueba del banco de pruebas. */
    index: number
    /** Centro x de la columna. */
    cx: number
    /** Borde de arriba de la card. */
    y: number
    cardWidth: number
    cardHeight: number
    /** Tiene el foco en la capa semántica: se dibuja el anillo. @default false */
    focused?: boolean
    /** Click en la card: abre el caso. Sin él, la card no se puede clickear. */
    onopen?: () => void
  }

  let { project, index, cx, y, cardWidth, cardHeight, focused = false, onopen }: Props = $props()

  const cy = $derived(y - cardHeight / 2)
  // En desarrollo, el banco de pruebas puede cambiar los casos por colores (`$lib/lab`).
  const testing = $derived(import.meta.env.DEV && !!lab?.colorCases)
  const preview = $derived(testing ? { ...project.preview, src: testPreview(index), fit: 'cover' as const } : project.preview)
  const background = $derived(preview.background === 'deep' ? PALETTE.brandDeep : PALETTE.paper)
</script>

{#if focused}
  <!-- Anillo de foco del teclado: un halo de tinta alrededor de la card, como el de los botones. -->
  <Rect
    width={cardWidth + 12}
    height={cardHeight + 12}
    radius={FIGURE.radius + 6}
    color={PALETTE.ink}
    opacity={0.3}
    x={cx}
    y={cy}
    z={-0.001}
  />
{/if}
<!-- La card: borde de 1 px de tinta al 10 % y la previsualización adentro, sin sombra. -->
<Rect
  width={cardWidth + FIGURE.strokeWidth * 2}
  height={cardHeight + FIGURE.strokeWidth * 2}
  radius={FIGURE.radius + FIGURE.strokeWidth}
  color={FIGURE.stroke}
  opacity={0.1}
  x={cx}
  y={cy}
/>
<Preview
  src={preview.src}
  width={cardWidth}
  height={cardHeight}
  fit={preview.fit}
  align={preview.align}
  {background}
  radius={FIGURE.radius}
  x={cx}
  y={cy}
  z={0.001}
/>
{#if onopen}
  <!-- Zona del click: invisible, sobre la card. -->
  <Rect
    width={cardWidth}
    height={cardHeight}
    radius={FIGURE.radius}
    opacity={0}
    x={cx}
    y={cy}
    z={0.002}
    cursor="pointer"
    onclick={(e) => {
      // Un arrastre del deck que termina sobre la card no la abre.
      if (e.delta > 6) return
      onopen()
    }}
  />
{/if}
