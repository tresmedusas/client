<script lang="ts">
  import { untrack } from 'svelte'
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { TextNode, type AnchorNormalized, type TextAlignment } from 'essentia-primitives'
  import { FONT } from '$lib/tokens.js'

  interface Props {
    text: string
    fontSize: number
    color: string
    maxWidth?: number
    /** URL de la fuente. @default FONT.regular */
    font?: string
    /** @default 1.5 */
    lineHeight?: number
    letterSpacing?: number
    alignment?: TextAlignment
    /** 0 = el borde izquierdo cae en `x`, 0.5 = el centro. @default 0 */
    anchorX?: AnchorNormalized
    /** 0 = el borde de arriba cae en `y`, 0.5 = el centro. @default 0 */
    anchorY?: AnchorNormalized
    x?: number
    y?: number
    z?: number
    /** Avisa la caja del texto cuando troika termina de maquetarlo. */
    onmeasure?: (width: number, height: number) => void
  }

  let {
    text,
    fontSize,
    color,
    maxWidth = Infinity,
    font = FONT.regular,
    lineHeight = 1.5,
    letterSpacing = 0,
    alignment = 'left',
    anchorX = 0,
    anchorY = 0,
    x = 0,
    y = 0,
    z = 0,
    onmeasure,
  }: Props = $props()

  const engine = useEngine()
  const { invalidate } = useThrelte()

  // Nodo propio y no <Text>: el apilado necesita el alto medido, que el shell
  // no expone. Sin `as`: la semántica la pone la capa prerenderizada.
  const node = untrack(
    () => new TextNode({ text, fontSize, color, font, maxWidth, lineHeight, letterSpacing, dpr: engine.viewport.dpr }),
  )
  const rect: [number, number, number, number] = [0, 0, 0, 0]

  const offSync = node.onSync(() => {
    node.localRect(rect)
    onmeasure?.(rect[2] - rect[0], rect[3] - rect[1])
    invalidate()
  })

  $effect(() => {
    node.setText(text)
    node.setFontSize(fontSize)
    node.setDpr(engine.viewport.dpr)
    node.setColor(color)
    node.setFont(font)
    node.setMaxWidth(maxWidth)
    node.setLineHeight(lineHeight)
    node.setLetterSpacing(letterSpacing)
    node.setAlignment(alignment)
    node.setAnchorX(anchorX)
    node.setAnchorY(anchorY)
    invalidate()
  })

  // Aparte: la posición cambia con el scroll y el layout, sin re-sincronizar.
  $effect(() => {
    node.setPosition(x, y, z)
    invalidate()
  })

  $effect(() => () => {
    offSync()
    node.destroy()
  })
</script>

<T is={node.root} dispose={false} />
