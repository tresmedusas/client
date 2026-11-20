<script lang="ts">
  import { T } from '@threlte/core'
  import { Rect } from 'essentia-primitives'
  import { FIGURE } from '$lib/tokens.js'
  import { hallEdges, hallFog, place, portals, type GalleryView, type Segment } from './gallery.js'

  /**
   * El pasillo de la galería, en líneas finas: un marco entre cada par de
   * escenas y las aristas que los unen hacia el punto de fuga. Está detrás de
   * todo el contenido. Trazos de `FIGURE` (DESIGN.md, sección 4): es el fondo
   * de la figura, así que va más tenue que un trazo normal.
   */
  interface Props {
    /** Posición del deck, en escenas. */
    position: number
    count: number
    camX: number
    view: GalleryView
  }

  let { position, count, camX, view }: Props = $props()

  const LINE = FIGURE.strokeOpacity * 0.6
  const W = FIGURE.strokeWidth
  /** Lo más cerca que se dibuja una arista (en escenas): más allá ya llena la ventana. */
  const NEAR_EDGE = 0.55

  const gates = $derived(
    portals(count).flatMap((p) => {
      const d = position - p
      const at = place(d, 0, camX, view)
      if (!at) return []
      const opacity = LINE * hallFog(d)
      if (opacity < 0.004) return []
      return [{ d, ...at, opacity }]
    }),
  )

  const edges = $derived.by(() => {
    const ds = portals(count).map((p) => position - p)
    const out: (Segment & { opacity: number })[] = []
    for (let j = 0; j < ds.length - 1; j++) {
      const near = Math.min(ds[j]!, NEAR_EDGE)
      const far = ds[j + 1]!
      if (far >= NEAR_EDGE) continue
      const opacity = LINE * 0.8 * hallFog(far)
      if (opacity < 0.004) continue
      for (const s of hallEdges(near, far, camX, view)) out.push({ ...s, opacity })
    }
    return out
  })

  const hw = $derived(view.hallWidth / 2)
  const hh = $derived(view.hallHeight / 2)
</script>

<T.Group position.z={-0.5}>
  {#each gates as g, j (j)}
    {@const w = hw * 2 * g.scale}
    {@const h = hh * 2 * g.scale}
    {@const cy = view.vanishY}
    <Rect width={w} height={W} color={FIGURE.stroke} opacity={g.opacity} x={g.x} y={cy + h / 2} />
    <Rect width={w} height={W} color={FIGURE.stroke} opacity={g.opacity} x={g.x} y={cy - h / 2} />
    <Rect width={W} height={h} color={FIGURE.stroke} opacity={g.opacity} x={g.x - w / 2} y={cy} />
    <Rect width={W} height={h} color={FIGURE.stroke} opacity={g.opacity} x={g.x + w / 2} y={cy} />
  {/each}

  {#each edges as e, j (j)}
    {@const dx = e.x2 - e.x1}
    {@const dy = e.y2 - e.y1}
    <T.Group position.x={(e.x1 + e.x2) / 2} position.y={(e.y1 + e.y2) / 2} rotation.z={Math.atan2(dy, dx)}>
      <Rect width={Math.hypot(dx, dy)} height={W} color={FIGURE.stroke} opacity={e.opacity} />
    </T.Group>
  {/each}
</T.Group>
