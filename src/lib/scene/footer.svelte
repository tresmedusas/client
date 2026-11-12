<script lang="ts">
  import { Rect } from 'essentia-primitives'
  import { FOOTER, SITE } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import MeasuredText from './measured-text.svelte'

  interface Props {
    width: number
    compact: boolean
    /** Año del build. */
    year: number
    onmeasure: (height: number) => void
  }

  let { width, compact, year, onmeasure }: Props = $props()

  const TOP = 36
  const BOTTOM = 48

  let brandHeight = $state(0)
  let taglineHeight = $state(0)
  let copyrightHeight = $state(0)

  const taglineY = $derived(-(TOP + brandHeight + 6))
  /** En escritorio el copyright va a la derecha, alineado con la marca. */
  const copyrightY = $derived(compact ? taglineY - taglineHeight - 16 : -TOP)

  $effect(() => {
    if (brandHeight > 0 && taglineHeight > 0 && copyrightHeight > 0)
      onmeasure(Math.max(-taglineY + taglineHeight, -copyrightY + copyrightHeight) + BOTTOM)
  })
</script>

<Rect width={width} height={1} color={PALETTE.muted} opacity={0.2} x={width / 2} y={0} />
<MeasuredText
  text={SITE.name}
  fontSize={18}
  color={PALETTE.text}
  font={FONT.bold}
  lineHeight={1.2}
  y={-TOP}
  onmeasure={(_, h) => (brandHeight = h)}
/>
<MeasuredText
  text={FOOTER.tagline}
  fontSize={15}
  color={PALETTE.muted}
  lineHeight={1.4}
  y={taglineY}
  onmeasure={(_, h) => (taglineHeight = h)}
/>
<MeasuredText
  text={FOOTER.copyright(year)}
  fontSize={14}
  color={PALETTE.muted}
  lineHeight={1.4}
  anchorX={compact ? 0 : 1}
  x={compact ? 0 : width}
  y={copyrightY}
  onmeasure={(_, h) => (copyrightHeight = h)}
/>
