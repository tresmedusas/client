/**
 * Las medidas ajustables del hero de la home: el tamaño del titular, las
 * separaciones y el lugar de la figura. Las usa `heroLayout` (`layout.ts`) y
 * `hero.svelte`. El banco de pruebas (`src/lib/lab/hero-lab*`, solo en
 * desarrollo) las ajusta en vivo; lo que se elige se pega acá.
 *
 * Lo demás del hero tiene su propio look: la figura, en `LOOK`
 * (`figures/hero.ts`); los tiempos del titular, en `HEADLINE_TIMING`
 * (`headline.ts`); el botón, en `PRISM_LOOK` (`prism-look.ts`).
 */
export interface HeroLook {
  // ── Titular ──
  /** Ancho máximo del titular en escritorio, en px: el protagonista, en dos líneas. */
  textMax: number
  /** Tamaño del titular en escritorio: esta fracción del ancho de la columna, entre el mínimo y el máximo (px). */
  sizeFraction: number
  sizeMin: number
  sizeMax: number
  /** Tamaño del titular en una columna: esta fracción del ancho, con este tope (px). */
  compactSizeFraction: number
  compactSizeMax: number
  /** Cuánto se aprietan las letras, en em (0.02: −2 % del tamaño). */
  tracking: number
  /** Espacio entre palabras, en em. */
  wordSpace: number
  /** Qué tan rápido se acomodan las palabras cuando cambia una (por s). */
  ease: number

  // ── Separaciones ──
  /** Titular → botón, en px: en escritorio y en una columna. */
  gap: number
  compactGap: number

  // ── Figura ──
  /** Ancho máximo del marco de la figura, en px. */
  figureMax: number
  /** Alto por debajo del cual la figura no se muestra, en px. */
  figureMinHeight: number
  /** Separación mínima botón → figura, en px. */
  figureGap: number
  /** Qué parte del alto que sobra va arriba del titular (el resto, entre el botón y la figura). */
  spareAbove: number
}

export const HERO_LOOK: HeroLook = {
  textMax: 960,
  sizeFraction: 0.07,
  sizeMin: 48,
  sizeMax: 80,
  compactSizeFraction: 0.12,
  compactSizeMax: 44,
  tracking: 0.02,
  wordSpace: 0.24,
  ease: 10,
  gap: 40,
  compactGap: 28,
  figureMax: 1100,
  figureMinHeight: 120,
  figureGap: 28,
  spareAbove: 0.65,
}
