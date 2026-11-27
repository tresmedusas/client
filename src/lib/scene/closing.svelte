<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { Glass } from 'essentia-crystal'
  import type { Link, Section } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import { CONTACT_FROST, frostAmount } from './contact-look.js'
  import CtaGroup from './cta-group.svelte'
  import Footer from './footer.svelte'
  import { FOOTER_GAP, NAV_SPACE, footerBands } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Escena de cierre: título grande y botones (el primero, el principal). La
   * última escena de una página lleva el pie: el cierre llena la ventana
   * (pedido del usuario, 2026-11-25), con el título y los botones centrados
   * bajo la navbar, y el pie va debajo, a la vista al seguir scrolleando.
   * Con `fullscreen` (Contacto, pedido del usuario, 2026-11-27), el cierre es
   * un componente que llena toda la pantalla, desde detrás de la navbar hasta
   * el pie, y el contenido va centrado en él: en el centro de la ventana.
   * Al llegar se desempaña (pedido del usuario, 2026-11-27): un vidrio
   * esmerilado cubre el componente y el contenido llega fuera de foco y un
   * poco más grande; con el scroll se aclara y queda nítido cuando el
   * componente llena la pantalla (`contact-look.ts`). Con `prism`, el
   * botón es el del hero (`prism-cta.svelte`, pedido del usuario,
   * 2026-11-27), con sus haces y su destello.
   */
  interface Props {
    section: Section
    links: readonly Link[]
    width: number
    viewportWidth: number
    viewportHeight: number
    compact: boolean
    /**
     * `center`: encabezado y botones centrados (DESIGN.md §6), como Contacto.
     * El cierre del showcase todavía va a la izquierda. @default 'start'
     */
    align?: 'start' | 'center'
    /**
     * Tamaño del encabezado: `section`, el de las demás secciones (Contacto,
     * pedido del usuario, 2026-11-25); `display`, el grande. @default 'display'
     */
    size?: 'section' | 'display'
    /** Año del build, para el pie; sin él no hay pie. */
    year?: number
    /** El componente llena toda la ventana (también detrás de la navbar) y el contenido va centrado en ella. @default false */
    fullscreen?: boolean
    /** El primer link va con el botón del hero (`prism-cta.svelte`); los demás, secundarios. @default false */
    prism?: boolean
    /** Corrimiento de la escena (0 = en pantalla): con `fullscreen`, cuánto empañado hay. @default 0 */
    d?: number
    /** El movimiento está permitido: sin él, no hay empañado. @default true */
    motion?: boolean
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { section, links, width, viewportWidth, viewportHeight, compact, align = 'start', size = 'display', year, fullscreen = false, prism = false, d = 0, motion = true, focusedHref, onmeasure, onnavigate }: Props = $props()

  const ACTION_GAP = 36

  let headHeight = $state(0)
  let ctaHeight = $state(0)

  const ctaY = $derived(-(headHeight + ACTION_GAP))
  /** Alto del título y los botones. */
  const block = $derived(-ctaY + ctaHeight)
  const bands = $derived(footerBands(compact))
  /**
   * Con pie, lo que ocupa el cierre sin él: toda la ventana bajo la navbar
   * (el slot lo deja 8 px más abajo cuando la escena scrollea adentro), o el
   * bloque y su aire si no entra.
   */
  const base = $derived(viewportHeight - NAV_SPACE - 8)
  const fits = $derived(block + FOOTER_GAP <= base)
  const fill = $derived(fits ? base : block + FOOTER_GAP)
  /** Lo que el componente sube detrás de la navbar: con `fullscreen`, hasta el borde de la ventana. */
  const lift = $derived(fullscreen ? NAV_SPACE + 8 : 0)
  /** Cuánto baja el bloque para quedar centrado en el componente (0 sin pie o si no entra). */
  const offset = $derived(year !== undefined && fits ? Math.max(0, (base - lift - block) / 2) : 0)

  /** El vidrio esmerilado va en el nivel de la navbar (z 10, como los bordes que deforman): Essentia tiene tres niveles y los otros dos los usan los botones (z 1) y el lente del link activo (z 11). */
  const FROST_Z = 9.9995
  /** Cuánto empañado hay: 1 al entrar, 0 con el componente llenando la pantalla. */
  const frost = $derived(fullscreen && motion ? frostAmount(d) : 0)
  /** La escala del contenido: llega un poco más grande y se asienta en 1. */
  const zoom = $derived(1 + CONTACT_FROST.zoom * frost)
  /** El reloj del botón del hero: corre solo mientras Contacto se ve. */
  let time = $state(0)
  useTask(
    (delta) => {
      time += delta
    },
    { running: () => prism && motion && Math.abs(d) < 1 },
  )

  /** El centro del bloque, de donde crece el contenido. */
  const blockCenter = $derived(-offset - block / 2)

  $effect(() => {
    if (headHeight === 0 || ctaHeight === 0) return
    // Con pie, el cierre llena la ventana y el pie queda debajo: se ve al seguir scrolleando.
    onmeasure(year === undefined ? block : fill + bands.top + bands.bottom)
  })
</script>

<T.Group position.x={width / 2} position.y={blockCenter} scale.x={zoom} scale.y={zoom}>
  <T.Group position.x={-width / 2} position.y={-blockCenter - offset}>
    <SectionHead {section} {width} {compact} {size} {align} onmeasure={(h) => (headHeight = h)} />
    <CtaGroup {links} {width} y={ctaY} {focusedHref} {align} {prism} {time} {motion} onmeasure={(h) => (ctaHeight = h)} {onnavigate} />
  </T.Group>
</T.Group>

{#if frost > 0.002 && ctaHeight > 0}
  <!-- El vidrio esmerilado: todo el componente, de lado a lado de la ventana y desde detrás de la navbar hasta el pie. -->
  <Glass
    width={viewportWidth}
    height={fill + lift}
    radius={0}
    refraction={0}
    dispersion={0}
    magnify={1}
    blur={CONTACT_FROST.blur * frost}
    tint={PALETTE.paper}
    tintOpacity={CONTACT_FROST.veil * frost}
    brightness={0}
    reflection={0}
    specular={0}
    rim={0}
    shadowOpacity={0}
    x={width / 2}
    y={(lift - fill) / 2}
    z={FROST_Z}
  />
{/if}

{#if year !== undefined && ctaHeight > 0}
  <Footer {width} {viewportWidth} {compact} y={-fill} {year} {focusedHref} {onnavigate} />
{/if}
