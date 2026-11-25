/**
 * El titular del hero con palabras que rotan (ver `HERO.headline`), como
 * funciones puras: las palabras de cada momento y su opacidad.
 *
 * Cada paso cambia un solo grupo, alternando: primero qué construimos
 * (artículo y sustantivo) y después para quién. Así se ven todas las
 * combinaciones de a una palabra por vez. En cada cambio, lo que cambia se
 * desvanece, se reemplaza y vuelve a aparecer; el resto queda quieto (y se
 * acomoda, ver `scene/hero.svelte`).
 */

export interface Headline {
  readonly before: string
  readonly what: readonly (readonly [string, string])[]
  readonly middle: string
  readonly who: readonly string[]
  readonly after: string
}

/** Una palabra del titular. `key` es estable entre pasos, para animarla en su lugar. */
export interface HeadlineWord {
  key: string
  text: string
  /** Rota: va en `ink` y black; si no, en `muted` y regular. */
  accent: boolean
  /** En escritorio, empieza una línea nueva. */
  breakBefore: boolean
  /** 0..1: se desvanece mientras cambia. */
  opacity: number
}

/** Segundos que se queda cada combinación, y los del fundido de salida y de entrada. */
export const HOLD = 2.4
export const FADE_OUT = 0.3
export const FADE_IN = 0.45
export const STEP = HOLD + FADE_OUT + FADE_IN

/** Qué variante muestra cada grupo en el paso `k`: los pasos impares cambian `what`, los pares `who`. */
export function variant(h: Headline, k: number): { what: number; who: number } {
  return { what: Math.floor((k + 1) / 2) % h.what.length, who: Math.floor(k / 2) % h.who.length }
}

/** Las palabras del titular en el paso `k`, todas opacas. */
export function headlineWords(h: Headline, k = 0): HeadlineWord[] {
  const { what, who } = variant(h, k)
  const [article, noun] = h.what[what]!
  const word = (key: string, text: string, accent: boolean, breakBefore = false): HeadlineWord => ({ key, text, accent, breakBefore, opacity: 1 })
  return [
    ...h.before.split(' ').map((w, i) => word(`b${i}`, w, false)),
    word('article', article, true),
    word('noun', noun, true),
    ...h.middle.split(' ').map((w, i) => word(`m${i}`, w, false, i === 0)),
    word('who', h.who[who]!, true),
    ...h.after.split(' ').map((w, i) => word(`a${i}`, w, false)),
  ]
}

/** El titular como texto plano: la capa semántica y el movimiento reducido. */
export const headlineText = (h: Headline, k = 0) => headlineWords(h, k).map((w) => w.text).join(' ')

/**
 * Las palabras a los `t` segundos: en cada paso, primero se desvanecen las
 * que cambian (todavía con el texto anterior), y después aparecen las nuevas.
 */
export function headlineAt(h: Headline, t: number): HeadlineWord[] {
  const k = Math.max(0, Math.floor(t / STEP))
  const u = t - k * STEP
  if (k === 0) return headlineWords(h, 0)
  const before = headlineWords(h, k - 1)
  const after = headlineWords(h, k)
  const fadingOut = u < FADE_OUT
  const words = fadingOut ? before : after
  const opacity = fadingOut ? 1 - u / FADE_OUT : Math.min(1, (u - FADE_OUT) / FADE_IN)
  return words.map((w, i) => (before[i]!.text === after[i]!.text ? w : { ...w, opacity: smooth(opacity) }))
}

const smooth = (x: number) => x * x * (3 - 2 * x)

/** La variante más ancha (en caracteres) de cada línea de escritorio, con `\n`: para el tamaño del titular. */
export function widestHeadline(h: Headline): string {
  const longest = (xs: readonly string[]) => xs.reduce((a, b) => (b.length > a.length ? b : a))
  const what = longest(h.what.map(([a, n]) => `${a} ${n}`))
  return `${h.before} ${what}\n${h.middle} ${longest(h.who)} ${h.after}`
}
