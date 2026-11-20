/**
 * La galería del showcase, como funciones puras (testeables sin GPU).
 *
 * La cámara de Essentia es ortográfica 1:1, así que la perspectiva se simula:
 * cada escena cuelga a su propia profundidad en un pasillo, y se dibuja
 * escalada hacia el punto de fuga según lo lejos que esté de la cámara. La
 * cámara camina por el pasillo con el deck: en la escena `k` está parada
 * frente a ella (escala 1, el layout de siempre) y al pasar a la siguiente
 * avanza; la escena que deja pasa de largo, y la que viene crece desde el
 * fondo. Los proyectos cuelgan en paredes alternas, así que además de avanzar
 * la cámara gira de una pared a la otra.
 *
 * Coordenadas: las de la escena (1 unidad = 1 px CSS, origen al centro de la
 * ventana, y hacia arriba). `d` es el corrimiento del deck respecto de una
 * escena: 0 = enfrente, 1 = ya pasó, −1 = la que viene.
 */

export interface GalleryView {
  /** Distancia focal, en px: cuánto se achica lo lejano. */
  focal: number
  /** Distancia entre dos escenas a lo largo del pasillo, en px. */
  spacing: number
  /** Cuánto se corre la cámara hacia cada pared, en px. */
  lateral: number
  /** El punto de fuga: el centro del área de contenido (bajo la navbar). */
  vanishY: number
  /** Ancho y alto del pasillo, para los marcos que lo dibujan. */
  hallWidth: number
  hallHeight: number
}

/**
 * Medidas del pasillo para una ventana de `vw` × `vh`. `navSpace` y `bottom`
 * son lo que tapan la navbar y el margen de abajo: el punto de fuga queda en
 * el medio de lo que se ve.
 */
export function galleryView(vw: number, vh: number, compact: boolean, navSpace: number, bottom: number): GalleryView {
  const focal = Math.max(600, Math.min(1400, Math.max(vw, vh) * 0.75))
  return {
    focal,
    spacing: focal * 1.5,
    lateral: compact ? vw * 0.14 : Math.min(vw * 0.26, 420),
    vanishY: (bottom - navSpace) / 2,
    // El marco más cercano queda apenas fuera de la ventana: la cámara está
    // parada en una puerta y la siguiente enmarca lo que viene.
    hallWidth: vw * (compact ? 1.9 : 2.3),
    hallHeight: vh * 1.8,
  }
}

/** En qué pared cuelga la escena `k` de `count`: −1 izquierda, 1 derecha, 0 al centro (apertura y cierre). */
export function wallOf(k: number, count: number): -1 | 0 | 1 {
  if (k <= 0 || k >= count - 1) return 0
  return k % 2 === 1 ? 1 : -1
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Dónde cuelga la escena `k` a lo ancho del pasillo, en px: la entrada y el
 * cierre en el eje, los proyectos en paredes alternas. Cada escena se ve
 * centrada cuando la cámara está frente a ella (ver DESIGN.md, sección 6).
 */
export function wallX(k: number, count: number, view: Pick<GalleryView, 'lateral'>): number {
  return wallOf(k, count) * view.lateral
}

/**
 * Dónde está la cámara a lo ancho del pasillo con el deck en `position`: frente
 * a la pared de cada escena, y entre dos escenas gira a mitad de camino (no al
 * salir ni al llegar).
 */
export function cameraX(position: number, count: number, view: Pick<GalleryView, 'lateral'>): number {
  const k = Math.floor(position)
  const t = smoothstep(0, 1, position - k)
  const a = wallX(k, count, view)
  const b = wallX(Math.min(k + 1, count - 1), count, view)
  return a + (b - a) * t
}

/** Más cerca que esto (en focales) la escena ya pasó de largo y no se dibuja. */
const NEAR = 0.9
/** Más lejos que esto (en escenas) no se dibuja. */
export const FAR = 3.5

/**
 * Escala de una escena a `d` del deck: 1 enfrente, menos de 1 si está más
 * adelante en el pasillo, más de 1 mientras pasa de largo. `null` si quedó
 * detrás de la cámara o demasiado lejos para dibujarla.
 */
export function depthScale(d: number, view: Pick<GalleryView, 'focal' | 'spacing'>): number | null {
  const depth = -d * view.spacing
  if (depth <= -view.focal * NEAR || -d > FAR) return null
  return view.focal / (view.focal + depth)
}

export interface Placement {
  /** Desplazamiento del grupo de la escena, en px. */
  x: number
  y: number
  /** Escala uniforme del grupo, alrededor del punto de fuga. */
  scale: number
}

/**
 * Dónde se dibuja una escena que cuelga en `wallX`, a `d` del deck, con la
 * cámara en `camX`: su layout de siempre, escalado alrededor del punto de
 * fuga y corrido por la posición de la cámara.
 */
export function place(d: number, wallX: number, camX: number, view: GalleryView): Placement | null {
  const scale = depthScale(d, view)
  if (scale === null) return null
  return { x: (wallX - camX) * scale, y: view.vanishY * (1 - scale), scale }
}

export interface Fade {
  /** El texto: se nota solo cuando la escena está cerca. */
  text: number
  /** Las obras (paneles, marcos): aparecen un poco antes que el texto. */
  art: number
}

/** Cuánto se desvanece lo que pasa de largo, a `d` > 0 del deck. */
const passing = (d: number) => 1 - smoothstep(0, 0.45, d)

/**
 * Opacidad de una escena a `d` del deck. La que pasa de largo se desvanece
 * antes de llenar la ventana; la que viene aparece mientras la cámara va
 * hacia ella. De lejos no se ve: todo está centrado, y una obra lejana
 * quedaría detrás del texto de la escena que se lee.
 */
export function fade(d: number): Fade {
  if (d >= 0) return { text: passing(d), art: passing(d) }
  const far = -d
  return { text: 1 - smoothstep(0, 0.75, far), art: 1 - smoothstep(0.2, 0.9, far) }
}

/**
 * Opacidad de las líneas del pasillo a `d` del deck: ellas sí se ven a lo
 * lejos, con niebla, y dibujan la profundidad hacia el punto de fuga.
 */
export function hallFog(d: number): number {
  if (d >= 0) return passing(d)
  const far = -d
  return Math.max(0, 1 - far * 0.26) * (1 - smoothstep(FAR - 1, FAR, far))
}

/**
 * Los marcos que dibujan el pasillo: uno entre cada par de escenas (y uno
 * antes de la primera y después de la última), en posiciones del deck.
 */
export function portals(count: number): number[] {
  return Array.from({ length: count + 1 }, (_, j) => j - 0.5)
}

/** Un segmento en pantalla, en px. */
export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Las cuatro aristas del pasillo entre dos marcos a `d1` y `d2` del deck (las
 * rectas que van al punto de fuga), con la cámara en `camX`. Vacío si alguno
 * quedó detrás de la cámara.
 */
export function hallEdges(d1: number, d2: number, camX: number, view: GalleryView): Segment[] {
  const a = place(d1, 0, camX, view)
  const b = place(d2, 0, camX, view)
  if (!a || !b) return []
  const hw = view.hallWidth / 2
  const hh = view.hallHeight / 2
  return [
    [-hw, -hh],
    [hw, -hh],
    [-hw, hh],
    [hw, hh],
  ].map(([cx, cy]) => ({
    x1: a.x + cx! * a.scale,
    y1: a.y + (view.vanishY + cy!) * a.scale,
    x2: b.x + cx! * b.scale,
    y2: b.y + (view.vanishY + cy!) * b.scale,
  }))
}
