/**
 * Trazos SVG animados con `<animate attributeName="d" values="…">` (SMIL):
 * se leen una vez y se interpolan en JS, para dibujarlos en un canvas al
 * ritmo del reloj de la escena (y pararlos con él).
 *
 * Todos los cuadros de un trazo tienen que tener los mismos comandos: solo
 * cambian los números. Funciones puras, testeables sin DOM.
 */

/** Un trazo: sus comandos y los números de cada cuadro. */
export interface MorphPath {
  /** Comandos en orden; `null` marca el lugar de cada número. */
  template: (string | null)[]
  frames: number[][]
}

export interface MorphSvg {
  /** viewBox: x, y, ancho, alto. */
  viewBox: [number, number, number, number]
  /** Segundos de un ciclo (0 si el dibujo es fijo). */
  duration: number
  paths: MorphPath[]
}

const TOKEN = /[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g

/** Separa un `d` en comandos y números. */
export function tokenize(d: string): { template: (string | null)[]; numbers: number[] } {
  const template: (string | null)[] = []
  const numbers: number[] = []
  for (const token of d.match(TOKEN) ?? []) {
    if (/^[a-zA-Z]$/.test(token)) template.push(token)
    else {
      template.push(null)
      numbers.push(Number(token))
    }
  }
  return { template, numbers }
}

/** Un trazo a partir de sus cuadros. Falla si los cuadros no tienen los mismos comandos. */
export function morphPath(frames: readonly string[]): MorphPath {
  const first = tokenize(frames[0] ?? '')
  const key = first.template.join(',')
  return {
    template: first.template,
    frames: frames.map((d, i) => {
      const { template, numbers } = tokenize(d)
      if (template.join(',') !== key) throw new Error(`El cuadro ${i} del trazo no tiene los mismos comandos que el primero`)
      return numbers
    }),
  }
}

/** Lee el viewBox, la duración y los trazos (con sus cuadros) de un SVG. */
export function parseMorphSvg(svg: string): MorphSvg {
  const box = svg.match(/viewBox="([^"]+)"/)?.[1]?.trim().split(/[\s,]+/).map(Number) ?? []
  const viewBox: [number, number, number, number] = [box[0] ?? 0, box[1] ?? 0, box[2] ?? 1, box[3] ?? 1]
  let duration = 0
  const paths: MorphPath[] = []
  for (const match of svg.matchAll(/<path\b([^>]*?)(?:\/>|>([\s\S]*?)<\/path>)/g)) {
    const attrs = match[1] ?? ''
    const inner = match[2] ?? ''
    const d = attrs.match(/\sd="([^"]*)"/)?.[1] ?? ''
    const animate = inner.match(/<animate\b[^>]*attributeName="d"[^>]*>/)?.[0]
    const values = animate?.match(/values="([^"]*)"/)?.[1]
    const dur = animate?.match(/dur="([\d.]+)s"/)?.[1]
    if (dur) duration = Math.max(duration, Number(dur))
    const frames = values
      ? values
          .split(';')
          .map((v) => v.trim())
          .filter(Boolean)
      : [d]
    paths.push(morphPath(frames))
  }
  return { viewBox, duration, paths }
}

/**
 * El `d` del trazo en `t` (0 a 1, el ciclo entero), interpolando lineal
 * entre cuadros como `calcMode="linear"`: el primer cuadro en 0 y el último en 1.
 */
export function morphAt(path: MorphPath, t: number): string {
  const n = path.frames.length
  const at = Math.min(Math.max(t, 0), 1) * (n - 1)
  const i = Math.min(Math.floor(at), Math.max(n - 2, 0))
  const u = n > 1 ? at - i : 0
  const a = path.frames[i] ?? []
  const b = path.frames[Math.min(i + 1, n - 1)] ?? a
  let k = 0
  let d = ''
  for (const part of path.template) {
    if (part !== null) d += part
    else {
      const va = a[k] ?? 0
      const value = va + ((b[k] ?? va) - va) * u
      d += `${value.toFixed(2)} `
      k++
    }
  }
  return d
}
