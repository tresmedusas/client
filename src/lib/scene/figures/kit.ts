/**
 * Piezas para figuras 3D line art (DESIGN.md §4): vista isométrica ortográfica,
 * trazos finos de tinta, caras blancas con los lados apenas sombreados, grilla
 * de puntos que se desvanece y un solo acento por figura.
 *
 * Todo sale de `FIGURE` y `PALETTE`. Los trazos van opacos (la tinta ya
 * mezclada con el papel): así el test de profundidad esconde las líneas que
 * quedan detrás de una cara.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Shape,
  SRGBColorSpace,
  Vector3,
  type Material,
} from 'three'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { FIGURE, PALETTE } from '$lib/tokens.js'

/** Dirección de la cámara de las figuras: azimut 45°, elevación ~32°. */
export const AZIMUTH = Math.PI / 4
export const ELEVATION = 0.56
export const CAMERA_DIR = new Vector3(
  Math.sin(AZIMUTH) * Math.cos(ELEVATION),
  Math.sin(ELEVATION),
  Math.cos(AZIMUTH) * Math.cos(ELEVATION),
)
/** En el piso, el eje que en pantalla va a la derecha y el que viene hacia adelante. */
export const RIGHT = new Vector3(1, 0, -1).normalize()
export const TOWARD = new Vector3(1, 0, 1).normalize()
/** Punto del piso: `s` a la derecha en pantalla y `t` hacia adelante. */
export const onFloor = (s: number, t = 0) => RIGHT.clone().multiplyScalar(s).addScaledVector(TOWARD, t)

/** La tinta mezclada con el papel en la proporción `a` (0 = papel, 1 = tinta). */
export const tint = (a: number) => new Color(PALETTE.paper).lerp(new Color(PALETTE.ink), a)

export const ease = (t: number) => t * t * (3 - 2 * t)
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function roundedShape(w: number, d: number, r: number): Shape {
  const s = new Shape()
  const x = -w / 2
  const y = -d / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + d - r)
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d)
  s.lineTo(x + r, y + d)
  s.quadraticCurveTo(x, y + d, x, y + d - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

interface SlabOptions {
  r?: number
  line?: LineMaterial
  top?: Material
}

interface BoxOptions {
  line?: LineMaterial
  top?: Material
  side?: Material
  front?: Material
}

/**
 * Materiales y constructores de una figura. Cada figura tiene su kit: los
 * materiales de línea llevan la resolución de su marco.
 */
export class Kit {
  readonly lineMaterials: LineMaterial[] = []
  readonly normal: LineMaterial
  readonly strong: LineMaterial
  /** Trazo destacado en blanco, sobre una superficie `brandDeep`. */
  readonly onDeep: LineMaterial
  /** Arriba es luz (blanco); los lados, un desvanecido de la tinta. */
  readonly top: MeshBasicMaterial
  readonly side: MeshBasicMaterial
  readonly front: MeshBasicMaterial
  readonly deep: MeshBasicMaterial
  private readonly disposables: { dispose(): void }[] = []

  constructor() {
    this.normal = this.line(FIGURE.strokeWidth, tint(FIGURE.strokeOpacity))
    this.strong = this.line(FIGURE.strokeStrongWidth, tint(FIGURE.strokeStrongOpacity))
    this.onDeep = this.line(FIGURE.strokeStrongWidth, new Color(PALETTE.brand))
    this.top = this.face(new Color(PALETTE.brand))
    this.side = this.face(tint(0.05))
    this.front = this.face(tint(0.09))
    this.deep = this.face(new Color(PALETTE.brandDeep))
  }

  private track<T extends { dispose(): void }>(item: T): T {
    this.disposables.push(item)
    return item
  }

  line(width: number, color: Color): LineMaterial {
    const m = this.track(new LineMaterial({ color, linewidth: width }))
    this.lineMaterials.push(m)
    return m
  }

  face(color: Color): MeshBasicMaterial {
    // Las caras se corren un poco hacia atrás: los bordes que caen sobre ellas se dibujan siempre.
    return this.track(new MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
  }

  /** Resolución del marco en px CSS: el grosor de los trazos se mide contra ella. */
  setResolution(width: number, height: number) {
    for (const m of this.lineMaterials) m.resolution.set(width, height)
  }

  private lines(geometry: LineSegmentsGeometry, material: LineMaterial): LineSegments2 {
    const lines = new LineSegments2(this.track(geometry), material)
    // three toma la resolución del viewport del canvas; la figura se dibuja en
    // su propio target, así que la pone el kit (setResolution).
    lines.onBeforeRender = () => {}
    return lines
  }

  edges(geometry: BufferGeometry, material = this.normal, threshold = 20): LineSegments2 {
    const edges = new EdgesGeometry(geometry, threshold)
    const lines = this.lines(new LineSegmentsGeometry().fromEdgesGeometry(edges), material)
    edges.dispose()
    return lines
  }

  segments(flat: number[], material = this.normal): LineSegments2 {
    return this.lines(new LineSegmentsGeometry().setPositions(flat), material)
  }

  polyline(points: Vector3[], material = this.normal, closed = false): LineSegments2 {
    const flat: number[] = []
    const n = closed ? points.length : points.length - 1
    for (let i = 0; i < n; i++) {
      const a = points[i]!
      const b = points[(i + 1) % points.length]!
      flat.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
    return this.segments(flat, material)
  }

  /** Rectángulo redondeado en el plano xz, a la altura `y`. */
  rrect(cx: number, cz: number, w: number, d: number, r: number, y: number, material = this.normal): LineSegments2 {
    const points = roundedShape(w, d, Math.min(r, w / 2, d / 2))
      .getPoints(6)
      .map((p) => new Vector3(cx + p.x, y, cz - p.y))
    return this.polyline(points, material, true)
  }

  /** Círculo en el plano xz, a la altura `y`. */
  circle(cx: number, cz: number, r: number, y: number, material = this.normal, n = 40): LineSegments2 {
    const points: Vector3[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      points.push(new Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r))
    }
    return this.polyline(points, material, true)
  }

  /** Renglones de texto en el plano xz: anchos en px, uno debajo del otro desde `z0`. */
  text(x0: number, z0: number, widths: number[], gap: number, y: number, material = this.normal): LineSegments2 {
    const flat: number[] = []
    widths.forEach((w, i) => flat.push(x0, y, z0 + i * gap, x0 + w, y, z0 + i * gap))
    return this.segments(flat, material)
  }

  /** Losa redondeada acostada: arriba es +y, de 0 a `h`. */
  slab(w: number, d: number, h: number, { r = FIGURE.radius, line = this.normal, top = this.top }: SlabOptions = {}): Group {
    const geometry = this.track(
      new ExtrudeGeometry(roundedShape(w, d, Math.min(r, w / 2, d / 2)), { depth: h, bevelEnabled: false, curveSegments: 10 }),
    )
    geometry.rotateX(-Math.PI / 2)
    const g = new Group()
    g.add(new Mesh(geometry, [top, this.side]))
    g.add(this.edges(geometry, line))
    return g
  }

  /** Caja centrada: +x es el lado, +z el frente, +y arriba. */
  box(w: number, h: number, d: number, { line = this.normal, top = this.top, side = this.side, front = this.front }: BoxOptions = {}): Group {
    const geometry = this.track(new BoxGeometry(w, h, d))
    const g = new Group()
    g.add(new Mesh(geometry, [side, side, top, top, front, front]))
    g.add(this.edges(geometry, line, 1))
    return g
  }

  /** Grilla de puntos cada `FIGURE.gridStep` px, que se desvanece hacia el borde. */
  dotGrid(radius: number): Points {
    const position: number[] = []
    const color: number[] = []
    const step = FIGURE.gridStep
    for (let x = -radius; x <= radius; x += step) {
      for (let z = -radius; z <= radius; z += step) {
        const d = Math.hypot(x, z) / radius
        if (d > 1) continue
        position.push(x, 0, z)
        // Un punto de 2 px se lee más claro que una línea: al 6 % no se vería.
        const c = tint(FIGURE.gridOpacity * 1.6 * (1 - d * d))
        color.push(c.r, c.g, c.b)
      }
    }
    const geometry = this.track(new BufferGeometry())
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    return new Points(geometry, this.track(new PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true })))
  }

  /** Sombra suave en el piso: la tinta que se desvanece hacia el papel (≤ 0.1). */
  shadow(w: number, d: number): Mesh {
    const m = new Mesh(
      this.track(new PlaneGeometry(w, d)),
      this.track(new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })),
    )
    m.rotation.x = -Math.PI / 2
    m.position.y = 0.2
    m.renderOrder = -1
    return m
  }

  dispose() {
    for (const item of this.disposables) item.dispose()
    this.disposables.length = 0
  }
}

let shadowMap: CanvasTexture | null = null

function shadowTexture(): CanvasTexture {
  if (shadowMap) return shadowMap
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const g = canvas.getContext('2d')!
  const ink = new Color(PALETTE.ink)
  const rgb = `${Math.round(ink.r * 255)},${Math.round(ink.g * 255)},${Math.round(ink.b * 255)}`
  const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, `rgba(${rgb},0.09)`)
  gradient.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gradient
  g.fillRect(0, 0, 128, 128)
  shadowMap = new CanvasTexture(canvas)
  shadowMap.colorSpace = SRGBColorSpace
  return shadowMap
}
