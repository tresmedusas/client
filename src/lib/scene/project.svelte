<script lang="ts">
  import { T } from '@threlte/core'
  import { Glass } from 'essentia-crystal'
  import { Image, Rect } from 'essentia-primitives'
  import { SHOWCASE, type Project } from '$lib/content.js'
  import { FONT, LOGO, PALETTE } from '$lib/tokens.js'
  import Chips from './chips.svelte'
  import MeasuredText from './measured-text.svelte'

  /**
   * Un proyecto del showcase, a pantalla completa: la imagen a la izquierda (o
   * arriba en un teléfono) y el texto al lado. Sin imagen, un panel de la marca
   * con el isotipo, que una lente de vidrio refracta al pasar.
   */
  interface Props {
    project: Project
    /** Posición en la lista, desde 0. */
    order: number
    total: number
    width: number
    viewportHeight: number
    compact: boolean
    d: number
    onmeasure: (height: number) => void
  }

  let { project, order, total, width, viewportHeight, compact, d, onmeasure }: Props = $props()

  const COLUMN_GAP = 48
  const visualWidth = $derived(compact ? width : Math.round(width * 0.54))
  const visualHeight = $derived(Math.round(Math.min(visualWidth / 1.6, compact ? viewportHeight * 0.3 : viewportHeight * 0.62)))
  const textX = $derived(compact ? 0 : visualWidth + COLUMN_GAP)
  const textWidth = $derived(compact ? width : width - visualWidth - COLUMN_GAP)
  const textTop = $derived(compact ? -(visualHeight + 28) : 0)
  const nameSize = $derived(compact ? 30 : Math.min(44, width * 0.04))

  let indexHeight = $state(0)
  let nameHeight = $state(0)
  let clientHeight = $state(0)
  let tagsHeight = $state(0)
  let problemLabelHeight = $state(0)
  let problemHeight = $state(0)
  let solutionLabelHeight = $state(0)
  let solutionHeight = $state(0)

  const nameY = $derived(textTop - indexHeight - 16)
  const clientY = $derived(nameY - nameHeight - 8)
  const tagsY = $derived(clientY - clientHeight - 18)
  const problemLabelY = $derived(tagsY - tagsHeight - 30)
  const problemY = $derived(problemLabelY - problemLabelHeight - 8)
  const solutionLabelY = $derived(problemY - problemHeight - 22)
  const solutionY = $derived(solutionLabelY - solutionLabelHeight - 8)
  const textHeight = $derived(-solutionY + solutionHeight)

  $effect(() => {
    if (indexHeight && nameHeight && clientHeight && tagsHeight && problemLabelHeight && problemHeight && solutionLabelHeight && solutionHeight)
      onmeasure(compact ? textHeight : Math.max(visualHeight, textHeight))
  })

  const lag = (k: number) => d * viewportHeight * k
  /** La lente cruza el panel mientras la escena se mueve. */
  const lens = $derived(Math.min(visualWidth, visualHeight) * 0.42)
  const lensX = $derived(visualWidth * (0.68 - d * 0.35))
  const lensY = $derived(-visualHeight * (0.62 + d * 0.2))
  const iso = $derived(visualHeight * 0.5)
  const label = (text: string) => text.toUpperCase()
</script>

<!-- Imagen o panel de la marca. -->
<T.Group position.y={lag(compact ? 0.05 : 0)}>
  {#if project.image}
    <Image src={project.image} width={visualWidth} height={visualHeight} radius={24} x={visualWidth / 2} y={-visualHeight / 2} />
  {:else}
    <Rect width={visualWidth} height={visualHeight} radius={24} color={PALETTE.brandDeep} x={visualWidth / 2} y={-visualHeight / 2} />
    <Image
      src={LOGO.isotipo.src}
      width={iso * LOGO.isotipo.aspect}
      height={iso}
      opacity={0.5}
      x={visualWidth / 2}
      y={-visualHeight / 2}
      z={0.001}
    />
    <Glass
      preset="lens"
      width={lens}
      height={lens}
      radius={lens / 2}
      magnify={1.25}
      dispersion={0.14}
      tint={PALETTE.brandLight}
      tintOpacity={0.08}
      shadowOpacity={0}
      x={lensX}
      y={lensY}
      z={1}
    />
  {/if}
</T.Group>

<T.Group position.y={lag(0.14)}>
  <MeasuredText
    text={`${String(order + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
    fontSize={14}
    color={PALETTE.brandInk}
    font={FONT.bold}
    letterSpacing={1.4}
    lineHeight={1.2}
    x={textX}
    y={textTop}
    onmeasure={(_, h) => (indexHeight = h)}
  />
  <MeasuredText
    text={project.name}
    fontSize={nameSize}
    color={PALETTE.ink}
    font={FONT.black}
    lineHeight={1.08}
    letterSpacing={-nameSize * 0.02}
    maxWidth={textWidth}
    x={textX}
    y={nameY}
    onmeasure={(_, h) => (nameHeight = h)}
  />
  <MeasuredText
    text={project.client}
    fontSize={16}
    color={PALETTE.muted}
    lineHeight={1.4}
    maxWidth={textWidth}
    x={textX}
    y={clientY}
    onmeasure={(_, h) => (clientHeight = h)}
  />
  <T.Group position.x={textX}>
    <Chips labels={project.tags} width={textWidth} y={tagsY} fontSize={13} accent onmeasure={(h) => (tagsHeight = h)} />
  </T.Group>
</T.Group>

<T.Group position.y={lag(0.26)}>
  {#each [
    { text: label(SHOWCASE.problemLabel), y: problemLabelY, set: (h: number) => (problemLabelHeight = h), small: true },
    { text: project.problem, y: problemY, set: (h: number) => (problemHeight = h), small: false },
    { text: label(SHOWCASE.solutionLabel), y: solutionLabelY, set: (h: number) => (solutionLabelHeight = h), small: true },
    { text: project.solution, y: solutionY, set: (h: number) => (solutionHeight = h), small: false },
  ] as line, i (i)}
    <MeasuredText
      text={line.text}
      fontSize={line.small ? 12 : compact ? 16 : 17}
      color={line.small ? PALETTE.muted : PALETTE.ink}
      font={line.small ? FONT.bold : FONT.regular}
      letterSpacing={line.small ? 1.6 : 0}
      lineHeight={line.small ? 1.2 : 1.55}
      maxWidth={textWidth}
      x={textX}
      y={line.y}
      onmeasure={(_, h) => line.set(h)}
    />
  {/each}
</T.Group>
