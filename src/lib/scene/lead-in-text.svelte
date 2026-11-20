<script lang="ts">
  // Párrafo con lead-in (ver DESIGN.md): la primera oración en `ink` y el
  // resto en `muted`, con el mismo peso y en un solo texto de troika, así que
  // el ajuste de línea es el del párrafo entero. Para todo párrafo de cuerpo
  // de la escena (bajadas, pasos, bios, descripciones).
  import type { ComponentProps } from 'svelte'
  import { leadIn } from '$lib/lead-in.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  type Props = Omit<ComponentProps<typeof MeasuredText>, 'color' | 'colorRanges' | 'font'>

  let { text, ...rest }: Props = $props()

  const lead = $derived(leadIn(text).lead)
  const ranges = $derived(lead ? [{ start: 0, end: lead.length, color: PALETTE.ink }] : null)
</script>

<MeasuredText {text} {...rest} font={FONT.regular} color={PALETTE.muted} colorRanges={ranges} />
