<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { Glass } from 'essentia-crystal'
  import { Rect } from 'essentia-primitives'
  import { Color, ShaderMaterial, Vector2, type IUniform } from 'three'
  import type { Link } from '$lib/content.js'
  import { prismLab } from '$lib/lab/prism-lab.svelte.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import { CTA_HEIGHT as HEIGHT } from './layout.js'
  import MeasuredText from './measured-text.svelte'
  import { MAX_BEAMS, PRISM_LOOK, SHADER_UNIFORMS, hueRanges } from './prism-look.js'
  import fragmentShader from './prism-ring.frag.glsl'
  import vertexShader from './quad.vert.glsl'

  /**
   * Botón del hero: una píldora de vidrio oscuro (`brandDeep`) con una lente
   * circular a la izquierda (más oscura, con una flecha blanca y un aro de
   * vidrio por el que se ven haces de luz iridiscentes; ver
   * `prism-ring.frag.glsl`) y el label en blanco al lado. Con el puntero
   * encima (o con foco) solo brillan más los haces: el vidrio no cambia.
   * Al hacer click, destello: los haces se encienden y una onda con sus
   * colores cruza la píldora, y recién después la página baja (sin
   * movimiento reducido: ahí navega enseguida, sin destello).
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
    /** El movimiento continuo está permitido: si no, el click no destella. @default true */
    motion?: boolean
    /** Borde de 1 px de este color (sobre un fondo oscuro, para que la píldora se separe). */
    border?: string
    /**
     * Profundidad del vidrio: 1, el nivel de captura del contenido; 11 en la
     * navbar, el nivel del lente del link activo (sobre los bordes que
     * deforman, que así no capturan sus haces). @default 1
     */
    z?: number
    /** Avisa el ancho del botón cuando el label está medido. */
    onmeasure?: (width: number) => void
    onnavigate: (href: string) => void
  }

  let { link, x, y, time, focused, motion = true, border, z = 1, onmeasure, onnavigate }: Props = $props()

  /** Los valores del botón (`prism-look.ts`); en desarrollo, los del banco de pruebas. */
  const look = $derived(prismLab?.look ?? PRISM_LOOK)
  /** Margen de la lente hasta el borde de la píldora (arriba, abajo y a la izquierda). */
  const lensMargin = $derived((HEIGHT - look.lensRadius * 2) / 2)
  /** Opacidad del borde claro: 1 px de blanco al 15 % sobre la píldora oscura. */
  const BORDER_ALPHA = 0.15
  /** Margen del quad de la lente y la onda, por lado (solo el antialias). */
  const HALO = 0

  let labelWidth = $state(0)
  const width = $derived(look.labelX + labelWidth + look.paddingRight)
  /** Centro de la lente, desde el centro de la píldora. */
  const lensX = $derived(-width / 2 + lensMargin + look.lensRadius)
  let hovered = $state(false)
  // El label se vuelve a medir si cambia su tamaño (banco de pruebas).
  let measuredSize = PRISM_LOOK.fontSize
  $effect(() => {
    if (look.fontSize === measuredSize) return
    measuredSize = look.fontSize
    labelWidth = 0
  })

  $effect(() => {
    if (labelWidth > 0) onmeasure?.(width)
  })

  const uniforms: Record<string, IUniform> = {
    u_quad: { value: new Vector2() },
    u_pill: { value: new Vector2() },
    u_lens: { value: new Vector2() },
    u_radius: { value: PRISM_LOOK.lensRadius },
    u_click: { value: 1e3 },
    u_time: { value: 0 },
    u_halo: { value: 0 },
    u_glass: { value: new Color(PALETTE.brandDeep) },
    u_icon: { value: new Color(PALETTE.white) },
    u_border: { value: new Color(PALETTE.white) },
    u_borderAlpha: { value: 0 },
    u_under: { value: false },
    HUES: { value: Array.from({ length: MAX_BEAMS }, () => new Vector2()) },
    ...Object.fromEntries(Object.values(SHADER_UNIFORMS).map((name) => [name, { value: 0 }])),
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })
  // Los haces en la píldora, debajo del vidrio: los mismos uniforms (comparten
  // cada valor), salvo `u_under`.
  const underMaterial = new ShaderMaterial({ vertexShader, fragmentShader, uniforms: { ...uniforms, u_under: { value: true } }, transparent: true, depthWrite: false })
  /**
   * Cuánto más atrás que el vidrio van los haces en la píldora: lo justo para
   * que entren en la captura que muestrea (un nivel de captura ve lo que está
   * a su z o detrás, y la z de un nivel es la de su vidrio más profundo, con
   * 0.001 de tolerancia). Así también quedan delante de los niveles de abajo:
   * en la navbar (z 11) los bordes que deforman (z 9.9995) no los ven.
   */
  const UNDER = 0.001
  const pillLit = $derived(look.pillBeams + look.pillEdge > 0)

  $effect(() => {
    uniforms.u_quad!.value.set(width + HALO * 2, HEIGHT + HALO * 2)
    uniforms.u_pill!.value.set(width, HEIGHT)
    uniforms.u_lens!.value.set(lensX, 0)
    uniforms.u_border!.value.set(border ?? PALETTE.white)
    uniforms.u_borderAlpha!.value = border ? BORDER_ALPHA : 0
  })

  // El look del shader: los haces, el aro, la lente y el click.
  $effect(() => {
    for (const [key, name] of Object.entries(SHADER_UNIFORMS)) uniforms[name]!.value = look[key as keyof typeof SHADER_UNIFORMS]
    uniforms.BEAMS!.value = Math.round(Math.min(MAX_BEAMS, Math.max(1, look.beams)))
    uniforms.u_radius!.value = look.lensRadius
    hueRanges(look).forEach(([hue, range], i) => (uniforms.HUES!.value as Vector2[])[i]!.set(hue, range))
  })

  // El destello del click corre con el reloj del hero, que sigue andando
  // mientras el hero sale de la pantalla.
  let clickAt = $state(-1e3)
  $effect(() => {
    uniforms.u_time!.value = time
    uniforms.u_click!.value = time - clickAt
  })

  // Cuánto espera la página antes de bajar después del click (`clickDelay`, en
  // ms): lo que tarda la onda en cruzar la píldora, para que se vea el destello.
  let pending: ReturnType<typeof setTimeout> | undefined
  /**
   * Un link afuera (WhatsApp, en Contacto) abre otra pestaña: va enseguida,
   * dentro del click, o el navegador puede bloquearla; el destello sigue en
   * esta página.
   */
  const external = $derived(/^https?:/.test(link.href))
  function activate() {
    if (pending) return
    // En el banco de pruebas, el click puede solo destellar, sin navegar.
    const navigate = prismLab?.navigate ?? true
    if (!motion) return navigate ? onnavigate(link.href) : undefined
    clickAt = time
    if (external) return navigate ? onnavigate(link.href) : undefined
    pending = setTimeout(() => {
      pending = undefined
      if (navigate) onnavigate(link.href)
    }, look.clickDelay)
  }
  $effect(() => () => clearTimeout(pending))

  // El halo va hacia su valor con una transición corta, aunque el reloj del
  // hero esté quieto (movimiento reducido): es la respuesta al puntero.
  const target = $derived(hovered || focused || prismLab?.hover ? 1 : 0)
  let halo = $state(0)
  useTask(
    (delta) => {
      const next = halo + (target - halo) * Math.min(1, delta * look.hoverSpeed)
      halo = Math.abs(target - next) < 0.002 ? target : next
    },
    { running: () => halo !== target },
  )
  $effect(() => {
    uniforms.u_halo!.value = halo
  })

  $effect(() => () => {
    material.dispose()
    underMaterial.dispose()
  })
</script>

<!--
  `z` (1): el nivel de captura de los vidrios del contenido. La lente y el label
  van adentro del vidrio (se mueven con su hover y su presión).
-->
{#if labelWidth > 0}
  {#if focused}
    <!-- Anillo de foco del teclado: un halo de tinta detrás del vidrio. -->
    <Rect width={width + 10} height={HEIGHT + 10} radius={(HEIGHT + 10) / 2} color={border ? PALETTE.white : PALETTE.ink} opacity={0.3} x={x + width / 2} y={y - HEIGHT / 2} z={z - 0.5} />
  {/if}
  {#if pillLit}
    <!-- Los haces en la píldora: detrás del vidrio, que los refracta, los esmerila y los tiñe. -->
    <T.Mesh position={[x + width / 2, y - HEIGHT / 2, z - UNDER]} scale.x={width} scale.y={HEIGHT}>
      <T.PlaneGeometry />
      <T is={underMaterial} />
    </T.Mesh>
  {/if}
  <Glass
    preset="pill"
    {width}
    height={HEIGHT}
    tint={PALETTE.brandDeep}
    tintOpacity={look.tintOpacity}
    brightness={look.glassBrightness}
    rim={look.rim}
    refraction={look.glassRefraction}
    dispersion={look.glassDispersion}
    bevelDepth={look.glassBevel}
    magnify={look.glassMagnify}
    blur={look.glassBlur}
    specular={look.glassSpecular}
    reflection={look.glassReflection}
    shadowOpacity={look.glassShadow}
    pressable
    cursor="pointer"
    x={x + width / 2}
    y={y - HEIGHT / 2}
    {z}
    onclick={activate}
    onpointerenter={() => (hovered = true)}
    onpointerleave={() => (hovered = false)}
  >
    <!-- La lente, el aro y la onda del click, encima del vidrio: un quad del tamaño de la píldora. -->
    <T.Mesh scale.x={width + HALO * 2} scale.y={HEIGHT + HALO * 2}>
      <T.PlaneGeometry />
      <T is={material} />
    </T.Mesh>
    <MeasuredText text={link.label} fontSize={look.fontSize} color={look.labelInk >= 0.5 ? PALETTE.ink : PALETTE.white} font={FONT.bold} lineHeight={1.2} anchorX={0} anchorY={0.5} x={-width / 2 + look.labelX} z={0.001} />
  </Glass>
{/if}

<!-- Medición: fuera de pantalla hasta que se sabe el ancho. -->
{#if labelWidth === 0}
  <MeasuredText text={link.label} fontSize={look.fontSize} color={PALETTE.ink} font={FONT.bold} lineHeight={1.2} x={-100000} onmeasure={(w) => (labelWidth = w)} />
{/if}
