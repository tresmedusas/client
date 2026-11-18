/**
 * Decisiones del deck de escenas, como funciones puras (testeables sin GPU ni
 * runes). El estado vive en `deck.svelte.ts`.
 *
 * Unidades: las posiciones del deck van en escenas (0 = la primera, 1.5 = a
 * mitad de camino entre la segunda y la tercera); el scroll interno de una
 * escena que no entra en la ventana, en píxeles CSS.
 */

/** Rueda acumulada (px) que pasa a la escena siguiente. */
export const WHEEL_THRESHOLD = 48
/**
 * Silencio (ms) que separa dos gestos de rueda. La inercia de un trackpad
 * manda eventos por casi un segundo: el gesto que cambió de escena no puede
 * cambiar otra hasta que pare.
 */
export const WHEEL_GAP = 200
/** Fracción de pantalla arrastrada que, al soltar, pasa de escena. */
export const DRAG_COMMIT = 0.16
/** Velocidad de arrastre (escenas/s) que pasa de escena aunque el tramo sea corto. */
export const FLING_COMMIT = 0.6
/** Resistencia del arrastre más allá de la primera o la última escena. */
export const EDGE_RESISTANCE = 0.25

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * A qué escena va el deck al soltar un arrastre: `offset` es cuánto se corrió
 * desde `index` (en escenas, positivo hacia la siguiente) y `velocity` la
 * velocidad al soltar (escenas/s).
 */
export function releaseTarget(index: number, offset: number, velocity: number, count: number): number {
  let target = index
  if (offset > DRAG_COMMIT || (offset > 0.02 && velocity > FLING_COMMIT)) target = index + 1
  else if (offset < -DRAG_COMMIT || (offset < -0.02 && velocity < -FLING_COMMIT)) target = index - 1
  return clamp(target, 0, count - 1)
}

/**
 * Corrimiento del deck mientras se arrastra `pixels` más allá del scroll
 * interno, para una ventana de `viewport` px: sigue al dedo, con resistencia
 * si no hay escena de ese lado.
 */
export function dragOffset(index: number, pixels: number, viewport: number, count: number): number {
  const raw = pixels / Math.max(1, viewport)
  const blocked = (raw > 0 && index >= count - 1) || (raw < 0 && index <= 0)
  return clamp(blocked ? raw * EDGE_RESISTANCE : raw, -1, 1)
}

/**
 * Área de contenido de una escena: arranca bajo la navbar y termina un margen
 * antes del borde de abajo. Un contenido más alto que el área scrollea adentro
 * de su escena antes de pasar a la siguiente.
 */
export interface SceneFrame {
  /** Distancia desde el borde de arriba de la ventana hasta el tope del contenido. */
  top: number
  /** Píxeles que el contenido no entra en el área: el scroll interno máximo. */
  overflow: number
}

export function sceneFrame(contentHeight: number, viewport: number, navSpace: number, bottom: number): SceneFrame {
  const area = viewport - navSpace - bottom
  if (contentHeight <= area) return { top: navSpace + (area - contentHeight) * 0.5, overflow: 0 }
  return { top: navSpace + 8, overflow: contentHeight - area + 8 }
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
