<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { CanvasTexture, Color, LinearFilter, ShaderMaterial } from 'three'
  import { LOGO, PALETTE } from '$lib/tokens.js'
  import fragmentShader from './hero-logo.frag.glsl'
  import { morphAt, parseMorphSvg, type MorphSvg } from './morph-path.js'
  import vertexShader from './quad.vert.glsl'

  /**
   * La medusa en «s» del hero, en tinta. El SVG trae su animación (cada trazo
   * cambia de forma en un ciclo): acá se interpola con el reloj del hero y se
   * dibuja en un canvas, así se frena con el reloj (fuera del hero o con
   * movimiento reducido queda en el primer cuadro).
   */
  interface Props {
    /** Caja del logo, por su centro. */
    x: number
    y: number
    width: number
    height: number
    /** Segundos del reloj del hero. */
    time: number
  }

  let { x, y, width, height, time }: Props = $props()

  const { invalidate } = useThrelte()

  let svg = $state.raw<MorphSvg | null>(null)
  $effect(() => {
    let alive = true
    fetch(LOGO.medusa.src)
      .then((r) => r.text())
      .then((text) => {
        if (alive) svg = parseMorphSvg(text)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  })

  const uniforms = {
    u_map: { value: null as CanvasTexture | null },
    u_color: { value: new Color(PALETTE.ink) },
  }
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })

  // El canvas mide lo que el logo en pantalla, a la densidad del dispositivo (hasta 2×).
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
  const pixels = $derived({ w: Math.max(1, Math.ceil(width * dpr)), h: Math.max(1, Math.ceil(height * dpr)) })

  let surface = $state.raw<{ ctx: CanvasRenderingContext2D; texture: CanvasTexture } | null>(null)
  $effect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = pixels.w
    canvas.height = pixels.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const texture = new CanvasTexture(canvas)
    texture.minFilter = LinearFilter
    texture.generateMipmaps = false
    uniforms.u_map.value = texture
    surface = { ctx, texture }
    return () => texture.dispose()
  })

  $effect(() => {
    if (!svg || !surface) return
    const { ctx, texture } = surface
    const { w, h } = pixels
    const [vx, vy, vw, vh] = svg.viewBox
    const t = svg.duration > 0 ? (time % svg.duration) / svg.duration : 0
    const s = Math.min(w / vw, h / vh)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.setTransform(s, 0, 0, s, (w - vw * s) / 2 - vx * s, (h - vh * s) / 2 - vy * s)
    // Solo cuenta el alfa: el color lo pone el shader.
    ctx.fillStyle = PALETTE.ink
    for (const path of svg.paths) ctx.fill(new Path2D(morphAt(path, t)))
    texture.needsUpdate = true
    invalidate()
  })

  $effect(() => () => material.dispose())
</script>

{#if svg && surface}
  <T.Mesh position.x={x} position.y={y} scale.x={width} scale.y={height}>
    <T.PlaneGeometry />
    <T is={material} />
  </T.Mesh>
{/if}
