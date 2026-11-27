<script lang="ts">
  import type { Link } from '$lib/content.js'
  import Cta from './cta.svelte'
  import PrismCta from './prism-cta.svelte'
  import { CTA_GAP, CTA_HEIGHT, flow } from './layout.js'

  /**
   * Botones en fila: el primero es el principal y los demás secundarios. Si no
   * entran en `width`, siguen en la fila de abajo. Con `prism`, el principal
   * es el botón del hero (`prism-cta.svelte`, Contacto).
   */
  interface Props {
    links: readonly Link[]
    width: number
    /** Borde de arriba. */
    y: number
    focusedHref: string | null
    /** `center`: cada fila centrada en `width` (DESIGN.md §6). @default 'start' */
    align?: 'start' | 'center'
    /** El principal es el botón del hero. @default false */
    prism?: boolean
    /** Segundos del reloj de los haces del botón del hero. @default 0 */
    time?: number
    /** El movimiento continuo está permitido (el destello del botón del hero). @default true */
    motion?: boolean
    /** Alto del grupo cuando todos los botones están medidos. */
    onmeasure?: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { links, width, y, focusedHref, align = 'start', prism = false, time = 0, motion = true, onmeasure, onnavigate }: Props = $props()

  let widths = $state<number[]>([])
  const measured = $derived(links.every((_, i) => (widths[i] ?? 0) > 0))
  const layout = $derived(flow(links.map((_, i) => widths[i] ?? 0), width, CTA_GAP, align))

  $effect(() => {
    if (measured) onmeasure?.(layout.rows * CTA_HEIGHT + (layout.rows - 1) * CTA_GAP)
  })
</script>

{#each links as link, i (link.href)}
  {#if i === 0 && prism}
    <PrismCta
      {link}
      x={layout.x[i] ?? 0}
      y={y - (layout.row[i] ?? 0) * (CTA_HEIGHT + CTA_GAP)}
      {time}
      focused={focusedHref === link.href}
      {motion}
      onmeasure={(w) => (widths[i] = w)}
      {onnavigate}
    />
  {:else}
    <Cta
      {link}
      variant={i === 0 ? 'primary' : 'secondary'}
      x={layout.x[i] ?? 0}
      y={y - (layout.row[i] ?? 0) * (CTA_HEIGHT + CTA_GAP)}
      focused={focusedHref === link.href}
      onmeasure={(w) => (widths[i] = w)}
      {onnavigate}
    />
  {/if}
{/each}
