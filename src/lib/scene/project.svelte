<script lang="ts">
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import { SHOWCASE, type Project } from '$lib/content.js'
  import { smoothstep, type Fade } from './gallery.js'
  import { FIGURE, FONT, LOGO, PALETTE } from '$lib/tokens.js'
  import LeadInText from './lead-in-text.svelte'
  import MeasuredText from './measured-text.svelte'

  /**
   * Un proyecto colgado en la galería, centrado: la obra arriba y, debajo, su
   * ficha (número, nombre, cliente y tipo de trabajo, problema y lo que
   * hicimos). La obra va en un marco de radio 16 con borde de 1 px de tinta
   * (DESIGN.md, sección 4). Sin imagen, es una superficie `brandDeep` con el
   * isotipo, que una lente de vidrio refracta.
   */
  interface Props {
    project: Project
    /** Posición en la lista, desde 0. */
    order: number
    total: number
    width: number
    viewportHeight: number
    compact: boolean
    /** Pared donde cuelga (−1 izquierda, 1 derecha): hacia dónde cruza la lente. */
    side: -1 | 1
    d: number
    fog: Fade
    /** z local de la lente: la deja en el nivel de captura del contenido. */
    glassZ: number
    onmeasure: (height: number) => void
  }

  let { project, order, total, width, viewportHeight, compact, side, d, fog, glassZ, onmeasure }: Props = $props()

  /** Entre la obra y la ficha. */
  const ART_GAP = $derived(compact ? 24 : 32)
  const cx = $derived(width / 2)
  const frameWidth = $derived(compact ? width : Math.round(Math.min(width * 0.62, 720)))
  const frameHeight = $derived(Math.round(Math.min(frameWidth / 1.6, viewportHeight * (compact ? 0.3 : 0.38))))
  /** La ficha centrada, en una medida corta (≈ 60 caracteres por línea). */
  const textWidth = $derived(Math.min(width, 560))
  const nameSize = $derived(compact ? 28 : Math.min(40, width * 0.036))
  const bodySize = $derived(compact ? 16 : 17)

  let indexHeight = $state(0)
  let nameHeight = $state(0)
  let metaHeight = $state(0)
  let problemLabelHeight = $state(0)
  let problemHeight = $state(0)
  let solutionLabelHeight = $state(0)
  let solutionHeight = $state(0)

  // La ficha, desde el borde de abajo de la obra.
  const textTop = $derived(-(frameHeight + ART_GAP))
  const nameY = $derived(textTop - indexHeight - 16)
  const metaY = $derived(nameY - nameHeight - 8)
  const ruleY = $derived(metaY - metaHeight - 24)
  const problemLabelY = $derived(ruleY - 24)
  const problemY = $derived(problemLabelY - problemLabelHeight - 8)
  const solutionLabelY = $derived(problemY - problemHeight - 24)
  const solutionY = $derived(solutionLabelY - solutionLabelHeight - 8)
  const measured = $derived(
    indexHeight > 0 && nameHeight > 0 && metaHeight > 0 && problemLabelHeight > 0 && problemHeight > 0 && solutionLabelHeight > 0 && solutionHeight > 0,
  )

  $effect(() => {
    if (measured) onmeasure(-solutionY + solutionHeight)
  })

  const cy = $derived(-frameHeight / 2)
  const art = $derived(fog.art)
  const text = $derived(fog.text)
  /**
   * La lente cruza la obra mientras la cámara se acerca, en el sentido en que
   * gira la cámara. El vidrio no tiene opacidad: en vez de desvanecerse, crece
   * al llegar y se encoge al irse.
   */
  const lensGrow = $derived(smoothstep(-0.6, -0.1, d) * (1 - smoothstep(0, 0.2, d)))
  const lens = $derived(Math.min(frameWidth, frameHeight) * 0.4 * lensGrow)
  const lensX = $derived(cx + frameWidth * side * (0.18 - d * 0.4))
  const lensY = $derived(-frameHeight * (0.6 + d * 0.25))
  const iso = $derived(frameHeight * 0.46)
  const meta = $derived([project.client, ...project.tags].join('  ·  '))
  const centered = { alignment: 'center', anchorX: 0.5 } as const
</script>

<!-- La obra: borde de 1 px de tinta al 10 % y la superficie adentro, sin sombra. -->
<Rect
  width={frameWidth + FIGURE.strokeWidth * 2}
  height={frameHeight + FIGURE.strokeWidth * 2}
  radius={FIGURE.radius + FIGURE.strokeWidth}
  color={FIGURE.stroke}
  opacity={0.1 * art}
  x={cx}
  y={cy}
/>
{#if project.image}
  <Image src={project.image} width={frameWidth} height={frameHeight} radius={FIGURE.radius} opacity={art} x={cx} y={cy} z={0.001} />
{:else}
  <Rect width={frameWidth} height={frameHeight} radius={FIGURE.radius} color={PALETTE.brandDeep} opacity={art} x={cx} y={cy} z={0.001} />
  <Image src={LOGO.isotipo.src} width={iso * LOGO.isotipo.aspect} height={iso} opacity={0.5 * art} x={cx} y={cy} z={0.002} />
  {#if lens > 1}
    <!-- Vidrio limpio: sin tinte, apenas más claro que lo que refracta (DESIGN.md, sección 5). -->
    <Glass
      preset="lens"
      width={lens}
      height={lens}
      radius={lens / 2}
      magnify={1.25}
      dispersion={0.14}
      tint={PALETTE.brandLight}
      tintOpacity={0}
      brightness={0.06}
      shadowOpacity={0}
      x={lensX}
      y={lensY}
      z={glassZ}
    />
  {/if}
{/if}

<!-- La ficha. -->
<MeasuredText
  text={`${String(order + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
  fontSize={13}
  color={PALETTE.brandInk}
  font={FONT.bold}
  letterSpacing={1.6}
  lineHeight={1.2}
  {...centered}
  x={cx}
  y={textTop}
  opacity={text}
  onmeasure={(_, h) => (indexHeight = h)}
/>
<LeadInText
  text={project.name}
  plain="ink"
  font={FONT.bold}
  fontSize={nameSize}
  lineHeight={1.1}
  letterSpacing={-nameSize * 0.02}
  maxWidth={textWidth}
  {...centered}
  x={cx}
  y={nameY}
  opacity={text}
  onmeasure={(_, h) => (nameHeight = h)}
/>
<MeasuredText
  text={meta}
  fontSize={15}
  color={PALETTE.muted}
  lineHeight={1.45}
  maxWidth={textWidth}
  {...centered}
  x={cx}
  y={metaY}
  opacity={text}
  onmeasure={(_, h) => (metaHeight = h)}
/>
<Rect width={48} height={FIGURE.strokeWidth} color={FIGURE.stroke} opacity={FIGURE.strokeOpacity * text} x={cx} y={ruleY} />
{#each [
  { label: SHOWCASE.problemLabel, body: project.problem, labelY: problemLabelY, bodyY: problemY, setLabel: (h: number) => (problemLabelHeight = h), setBody: (h: number) => (problemHeight = h) },
  { label: SHOWCASE.solutionLabel, body: project.solution, labelY: solutionLabelY, bodyY: solutionY, setLabel: (h: number) => (solutionLabelHeight = h), setBody: (h: number) => (solutionHeight = h) },
] as part, i (i)}
  <MeasuredText
    text={part.label.toUpperCase()}
    fontSize={12}
    color={PALETTE.brandInk}
    font={FONT.bold}
    letterSpacing={1.6}
    lineHeight={1.2}
    {...centered}
    x={cx}
    y={part.labelY}
    opacity={text}
    onmeasure={(_, h) => part.setLabel(h)}
  />
  <LeadInText
    text={part.body}
    fontSize={bodySize}
    lineHeight={1.55}
    maxWidth={textWidth}
    {...centered}
    x={cx}
    y={part.bodyY}
    opacity={text}
    onmeasure={(_, h) => part.setBody(h)}
  />
{/each}
