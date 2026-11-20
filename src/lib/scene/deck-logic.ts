/**
 * Decisiones del deck de escenas, como funciones puras (testeables sin GPU ni
 * runes). El estado vive en `deck.svelte.ts`.
 *
 * Unidades: las posiciones del deck van en escenas (0 = la primera, 1.5 = a
 * mitad de camino entre la segunda y la tercera); el scroll interno de una
 * escena que no entra en la ventana, en píxeles CSS.
 */

/**
 * Frecuencia natural (rad/s) del resorte con el que el scroll sigue a la rueda
 * y al teclado: alcanza el destino en ~0,2 s. Suaviza los saltos de un mouse
 * (100 px por muesca) sin que un trackpad, que ya manda deltas suaves, se
 * sienta atrasado.
 */
export const SCROLL_STIFFNESS = 24
/**
 * Frecuencia natural (rad/s) para ir a una escena (links, marcas, Home/End):
 * un recorrido largo, ~0,6 s.
 */
export const DECK_STIFFNESS = 9
/**
 * Constante de tiempo (s) de la inercia al soltar un arrastre: la velocidad
 * decae como e^(−t/τ) y el contenido recorre velocidad · τ, como el scroll
 * nativo de un teléfono.
 */
export const MOMENTUM = 0.45
/** Resistencia del arrastre más allá del principio o el final de la página. */
export const EDGE_RESISTANCE = 0.3

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Velocidad inicial (px/s) del resorte al soltar un arrastre: la del dedo,
 * para que el scroll siga el gesto sin frenar en seco. Solo cuenta si va
 * hacia el target y se limita a `stiffness · |remaining|`, lo que un resorte
 * críticamente amortiguado puede absorber sin pasarse. `remaining` es target −
 * posición.
 */
export function launchVelocity(remaining: number, velocity: number, stiffness: number): number {
  if (remaining === 0 || Math.sign(velocity) !== Math.sign(remaining)) return 0
  return Math.sign(velocity) * Math.min(Math.abs(velocity), stiffness * Math.abs(remaining))
}

/**
 * La página como un solo scroll, en píxeles CSS: cada escena recorre primero
 * su scroll interno (`overflows[i]`, lo que no entra en la ventana) y después
 * la transición a la siguiente (`travels[i]`). Así todo se mueve 1:1 con la
 * rueda o el dedo, como una página.
 */
export interface PageLayout {
  /** Scroll en el que la escena `i` queda en pantalla con su scroll interno en 0. */
  starts: number[]
  overflows: number[]
  /** Recorrido de la transición entre la escena `i` y la siguiente (una menos que escenas). */
  travels: number[]
  /** Scroll máximo: la última escena con todo su scroll interno. */
  total: number
}

export function pageLayout(overflows: readonly number[], travels: readonly number[]): PageLayout {
  const starts: number[] = []
  let at = 0
  for (let i = 0; i < overflows.length; i++) {
    starts.push(at)
    at += Math.max(0, overflows[i] ?? 0) + (i < overflows.length - 1 ? Math.max(1, travels[i] ?? 1) : 0)
  }
  return { starts, overflows: overflows.map((o) => Math.max(0, o)), travels: [...travels], total: at }
}

/** Qué se ve con un scroll dado. */
export interface PageSpot {
  /** Escena que se ve, con decimales durante la transición (como `Deck.position`). */
  position: number
  /** Escena cuyo tramo contiene el scroll: la de arriba durante una transición. */
  scene: number
  /** Scroll interno de `scene`, en px. */
  inner: number
}

export function locate(layout: PageLayout, scroll: number): PageSpot {
  const { starts, overflows, travels, total } = layout
  const s = clamp(scroll, 0, total)
  let scene = 0
  while (scene < starts.length - 1 && starts[scene + 1]! <= s) scene++
  const local = s - starts[scene]!
  const overflow = overflows[scene] ?? 0
  if (local <= overflow || scene >= travels.length) return { position: scene, scene, inner: Math.min(local, overflow) }
  return { position: scene + (local - overflow) / travels[scene]!, scene, inner: overflow }
}

/** El scroll de una escena: el de su comienzo, más `inner` de su scroll interno. */
export function scrollOf(layout: PageLayout, scene: number, inner = 0): number {
  const i = clamp(Math.round(scene), 0, layout.starts.length - 1)
  return layout.starts[i]! + clamp(inner, 0, layout.overflows[i] ?? 0)
}

/** El scroll de un `PageSpot` (la inversa de `locate`), para mantenerlo si cambia el layout. */
export function scrollAt(layout: PageLayout, spot: PageSpot): number {
  const scene = clamp(spot.scene, 0, layout.starts.length - 1)
  const transition = spot.position - scene
  if (transition <= 0 || scene >= layout.travels.length) return scrollOf(layout, scene, spot.inner)
  return layout.starts[scene]! + (layout.overflows[scene] ?? 0) + Math.min(1, transition) * layout.travels[scene]!
}

/**
 * Área de contenido de una escena: arranca un margen (`top`) bajo el borde de
 * arriba y termina `bottom` antes del de abajo, donde va la navbar. Un contenido más alto que el área scrollea adentro
 * de su escena antes de pasar a la siguiente.
 */
export interface SceneFrame {
  /** Distancia desde el borde de arriba de la ventana hasta el tope del contenido. */
  top: number
  /** Píxeles que el contenido no entra en el área: el scroll interno máximo. */
  overflow: number
}

export function sceneFrame(contentHeight: number, viewport: number, top: number, bottom: number): SceneFrame {
  const area = viewport - top - bottom
  if (contentHeight <= area) return { top: top + (area - contentHeight) * 0.5, overflow: 0 }
  return { top: top + 8, overflow: contentHeight - area + 8 }
}

/** Separación mínima entre dos escenas mientras pasan juntas. */
export const SCENE_GAP = 48

/**
 * Cuánto se corren las dos escenas de una transición (la de arriba sale, la de
 * abajo entra, o al revés). Las dos se mueven lo mismo, así nunca se pisan, y
 * lo bastante para que la de arriba salga entera aunque sea más alta que la
 * ventana. `upperBottom` y `lowerTop` son el borde de abajo de la escena de
 * arriba y el de arriba de la de abajo, en pantalla y en reposo (con su
 * scroll interno), medidos desde el tope de la ventana.
 */
export function travel(viewport: number, upperBottom: number, lowerTop: number): number {
  return Math.max(viewport, upperBottom, upperBottom - lowerTop + SCENE_GAP)
}

/** El índice de la escena con id `id`, o -1. Acepta `#id`. */
export function sceneIndex(scenes: readonly string[], id: string): number {
  return scenes.indexOf(id.replace(/^#/, ''))
}
