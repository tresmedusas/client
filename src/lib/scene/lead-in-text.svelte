<script lang="ts">
  // Texto con lead-in (ver DESIGN.md): la primera oración en `ink` y el resto
  // en `muted`, con el mismo peso y en un solo texto de troika, así que el
  // ajuste de línea es el del bloque entero. Para títulos y párrafos de la
  // escena: el peso lo da `font` (regular en un párrafo, bold o black en un
  // título).
  import type { ComponentProps } from 'svelte'
  import { leadIn } from '$lib/lead-in.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  type Props = Omit<ComponentProps<typeof MeasuredText>, 'color' | 'colorRanges'> & {
    /**
     * Color de todo el texto cuando no tiene lead-in (una sola oración): `ink`
     * en un título, `muted` en un párrafo. @default 'muted'
     */
    plain?: 'ink' | 'muted'
  }

  let { text, font = FONT.regular, plain = 'muted', ...rest }: Props = $props()

  const lead = $derived(leadIn(text).lead)
  const ranges = $derived(lead ? [{ start: 0, end: lead.length, color: PALETTE.ink }] : null)
  const color = $derived(lead ? PALETTE.muted : PALETTE[plain])
</script>

<MeasuredText {text} {...rest} {font} {color} colorRanges={ranges} />
