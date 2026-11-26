<script lang="ts">
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import type { Link } from '$lib/content.js'
  import { PALETTE } from '$lib/tokens.js'
  import { CTA_HEIGHT as SIZE } from './layout.js'

  /**
   * Volver (pedido del usuario, 2026-11-26, en la página de un caso): un
   * botón redondo con una flecha hacia la izquierda, sin texto. Es el vidrio
   * de los botones secundarios (`cta.svelte`), del alto de los botones; el
   * label del link es para la capa semántica.
   */
  interface Props {
    link: Link
    /** Centro. */
    x: number
    y: number
    /** Tiene el foco en la capa semántica: se dibuja el anillo. */
    focused: boolean
    onnavigate: (href: string) => void
  }

  let { link, x, y, focused, onnavigate }: Props = $props()

  /** La flecha (`static/icons/arrow-left.svg`, en `ink`). */
  const ICON = 22
</script>

{#if focused}
  <!-- Anillo de foco del teclado, como el de los botones. -->
  <Rect width={SIZE + 10} height={SIZE + 10} radius={(SIZE + 10) / 2} color={PALETTE.ink} opacity={0.3} {x} {y} z={0.5} />
{/if}
<!-- Borde de 1 px de tinta y el papel debajo: sobre el papel blanco, el vidrio limpio solo no se ve (DESIGN.md §1). -->
<Rect width={SIZE + 2} height={SIZE + 2} radius={(SIZE + 2) / 2} color={PALETTE.ink} opacity={0.12} {x} {y} z={0.3} />
<Rect width={SIZE} height={SIZE} radius={SIZE / 2} color={PALETTE.paper} {x} {y} z={0.4} />
<Glass
  preset="pill"
  width={SIZE}
  height={SIZE}
  tint={PALETTE.brand}
  tintOpacity={0.06}
  brightness={focused ? 0.12 : 0}
  rim={focused ? 0.9 : 0.25}
  shadowOpacity={0}
  hoverable
  pressable
  cursor="pointer"
  {x}
  {y}
  z={1}
  onclick={() => onnavigate(link.href)}
>
  <Image src="/icons/arrow-left.svg" width={ICON} height={ICON} />
</Glass>
