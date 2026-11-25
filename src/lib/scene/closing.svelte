<script lang="ts">
  import { T } from '@threlte/core'
  import type { Link, Section } from '$lib/content.js'
  import CtaGroup from './cta-group.svelte'
  import Footer from './footer.svelte'
  import { FOOTER_GAP, NAV_SPACE, footerBands } from './layout.js'
  import SectionHead from './section-head.svelte'

  /**
   * Escena de cierre: título grande y botones (el primero, el principal). La
   * última escena de una página lleva el pie: el cierre llena la ventana
   * (pedido del usuario, 2026-11-25), con el título y los botones centrados
   * bajo la navbar, y el pie va debajo, a la vista al seguir scrolleando.
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
    /**
     * Alto de las franjas de los bordes (px CSS). Con franjas altas (el
     * showcase), el bloque se centra en la ventana, entre las dos, para no
     * quedar deformado en reposo. @default 0
     */
    band?: number
    focusedHref: string | null
    onmeasure: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { section, links, width, viewportWidth, viewportHeight, compact, align = 'start', size = 'display', year, band = 0, focusedHref, onmeasure, onnavigate }: Props = $props()

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
  /**
   * Cuánto baja el bloque para quedar centrado bajo la navbar (0 sin pie o si
   * no entra); con franjas, centrado en la ventana, entre las dos.
   */
  const offset = $derived.by(() => {
    if (year === undefined || !fits) return 0
    if (band <= 0) return (base - block) / 2
    return Math.max(0, Math.min(base - block, (viewportHeight - block) / 2 - (NAV_SPACE + 8)))
  })

  $effect(() => {
    if (headHeight === 0 || ctaHeight === 0) return
    // Con pie, el cierre llena la ventana y el pie queda debajo: se ve al seguir scrolleando.
    onmeasure(year === undefined ? block : fill + bands.top + bands.bottom)
  })
</script>

<T.Group position.y={-offset}>
  <SectionHead {section} {width} {compact} {size} {align} onmeasure={(h) => (headHeight = h)} />
  <CtaGroup {links} {width} y={ctaY} {focusedHref} {align} onmeasure={(h) => (ctaHeight = h)} {onnavigate} />
</T.Group>

{#if year !== undefined && ctaHeight > 0}
  <Footer {width} {viewportWidth} {compact} y={-fill} {year} {focusedHref} {onnavigate} />
{/if}
