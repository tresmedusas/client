<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { Glass } from 'essentia-crystal'
  import { Rect } from 'essentia-primitives'
  import { Color, ShaderMaterial, Vector2 } from 'three'
  import type { Link } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { CTA_HEIGHT as HEIGHT } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import fragmentShader from './prism-ring.frag.glsl'
  import vertexShader from './quad.vert.glsl'

  /**
   * Botón del hero: una píldora de vidrio oscuro (`brandDeep`) con una lente
   * circular a la izquierda (más oscura, con una flecha blanca y un aro de
   * vidrio por el que se ven haces de luz iridiscentes; ver
   * `prism-ring.frag.glsl`) y el label en blanco al lado. Con el puntero
   * encima (o con foco) solo brillan más los haces: el vidrio no cambia.
   */
  interface Props {
    link: Link
    /** Borde izquierdo. */
    x: number
    /** Borde de arriba. */
    y: number
    /** Segundos del reloj del hero: los haces se mueven con él. */
    time: number
    /** Tiene el foco en la capa semántica: se dibuja el anillo. */
    focused: boolean
    /** Avisa el ancho del botón cuando el label está medido. */
    onmeasure?: (width: number) => void
    onnavigate: (href: string) => void
  }

  let { link, x, y, time, focused, onmeasure, onnavigate }: Props = $props()

  const FONT_SIZE = 16
  /** Radio de la lente y su margen hasta el borde de la píldora (arriba, abajo y a la izquierda). */
  const LENS_RADIUS = 20
  const LENS_MARGIN = (HEIGHT - LENS_RADIUS * 2) / 2
  /** Borde izquierdo del label y margen a su derecha. */
  const LABEL_X = 62
  const PADDING_RIGHT = 26
  /** Margen del quad de la lente, por lado (la luz no sale: solo el antialias). */
  const HALO = 2

  let labelWidth = $state(0)
  const width = $derived(LABEL_X + labelWidth + PADDING_RIGHT)
  let hovered = $state(false)

  $effect(() => {
    if (labelWidth > 0) onmeasure?.(width)
  })

  const uniforms = {
    u_quad: { value: new Vector2((LENS_RADIUS + HALO) * 2, (LENS_RADIUS + HALO) * 2) },
    u_radius: { value: LENS_RADIUS },
    u_time: { value: 0 },
    u_halo: { value: 0 },
    u_glass: { value: new Color(PALETTE.brandDeep) },
    u_icon: { value: new Color(PALETTE.white) },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  $effect(() => {
    uniforms.u_time.value = time
  })

  // El halo va hacia su valor con una transición corta, aunque el reloj del
  // hero esté quieto (movimiento reducido): es la respuesta al puntero.
  const target = $derived(hovered || focused ? 1 : 0)
  let halo = $state(0)
  useTask(
    (delta) => {
      const next = halo + (target - halo) * Math.min(1, delta * 10)
      halo = Math.abs(target - next) < 0.002 ? target : next
    },
    { running: () => halo !== target },
  )
  $effect(() => {
    uniforms.u_halo.value = halo
  })

  $effect(() => () => material.dispose())
</script>

<!--
  z = 1: el nivel de captura de los vidrios del contenido. La lente y el label
  van adentro del vidrio (se mueven con su hover y su presión).
-->
{#if labelWidth > 0}
  {#if focused}
    <!-- Anillo de foco del teclado: un halo de tinta detrás del vidrio. -->
    <Rect width={width + 10} height={HEIGHT + 10} radius={(HEIGHT + 10) / 2} color={PALETTE.ink} opacity={0.3} x={x + width / 2} y={y - HEIGHT / 2} z={0.5} />
  {/if}
  <Glass
    preset="pill"
    {width}
    height={HEIGHT}
    tint={PALETTE.brandDeep}
    tintOpacity={0.94}
    brightness={0}
    rim={0.2}
    shadowOpacity={0}
    pressable
    cursor="pointer"
    x={x + width / 2}
    y={y - HEIGHT / 2}
    z={1}
    onclick={() => onnavigate(link.href)}
    onpointerenter={() => (hovered = true)}
    onpointerleave={() => (hovered = false)}
  >
    <T.Mesh position.x={-width / 2 + LENS_MARGIN + LENS_RADIUS} scale.x={(LENS_RADIUS + HALO) * 2} scale.y={(LENS_RADIUS + HALO) * 2}>
      <T.PlaneGeometry />
      <T is={material} />
    </T.Mesh>
    <MeasuredText text={link.label} fontSize={FONT_SIZE} color={PALETTE.white} font={FONT.regular} lineHeight={1.2} anchorX={0} anchorY={0.5} x={-width / 2 + LABEL_X} z={0.001} />
  </Glass>
{/if}

<!-- Medición: fuera de pantalla hasta que se sabe el ancho. -->
{#if labelWidth === 0}
  <MeasuredText text={link.label} fontSize={FONT_SIZE} color={PALETTE.ink} font={FONT.regular} lineHeight={1.2} x={-100000} onmeasure={(w) => (labelWidth = w)} />
{/if}
