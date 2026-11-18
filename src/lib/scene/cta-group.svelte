<script lang="ts">
  import type { Link } from '$lib/content.js'
  import Cta from './cta.svelte'
  import { CTA_GAP, CTA_HEIGHT, flow } from './layout.js'

  /**
   * Botones en fila: el primero es el principal y los demás secundarios. Si no
   * entran en `width`, siguen en la fila de abajo.
   */
  interface Props {
    links: readonly Link[]
    width: number
    /** Borde de arriba. */
    y: number
    focusedHref: string | null
    /** Alto del grupo cuando todos los botones están medidos. */
    onmeasure?: (height: number) => void
    onnavigate: (href: string) => void
  }

  let { links, width, y, focusedHref, onmeasure, onnavigate }: Props = $props()

  let widths = $state<number[]>([])
  const measured = $derived(links.every((_, i) => (widths[i] ?? 0) > 0))
  const layout = $derived(flow(links.map((_, i) => widths[i] ?? 0), width, CTA_GAP))

  $effect(() => {
    if (measured) onmeasure?.(layout.rows * CTA_HEIGHT + (layout.rows - 1) * CTA_GAP)
  })
</script>

{#each links as link, i (link.href)}
  <Cta
    {link}
    variant={i === 0 ? 'primary' : 'secondary'}
    x={layout.x[i] ?? 0}
    y={y - (layout.row[i] ?? 0) * (CTA_HEIGHT + CTA_GAP)}
    focused={focusedHref === link.href}
    onmeasure={(w) => (widths[i] = w)}
    {onnavigate}
  />
{/each}
