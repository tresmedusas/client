/**
 * Valores visuales de la landing, sin imports: `+layout.svelte` los publica
 * como variables CSS para el primer paint, y three y troika no pueden entrar a
 * ese JS. La escena los lee de acá también.
 *
 * Identidad provisoria (todavía no hay una definitiva): fondo marino profundo
 * y acentos bioluminiscentes. Cambiarla es cambiar este archivo.
 */

export const PALETTE = {
  /** Fondo: el abismo. */
  abyss: '#050b18',
  /** Fondo más claro, cerca de la superficie. */
  deep: '#0b1d3a',
  /** Texto principal. */
  text: '#eaf2ff',
  /** Texto secundario. */
  muted: '#9fb2cf',
  /** Acento bioluminiscente. */
  accent: '#6fe3d6',
  /** Segundo acento, para las medusas. */
  glow: '#b69cff',
  /** Texto sobre el acento. */
  onAccent: '#04121a',
} as const

/**
 * Fuentes servidas por el sitio. En .woff porque troika no lee .woff2, y con
 * el subset latin, que cubre el español: un glifo que falte haría que troika
 * lo busque en su CDN.
 */
export const FONT = {
  regular: '/fonts/manrope-latin-400-normal.woff',
  semibold: '/fonts/manrope-latin-600-normal.woff',
  bold: '/fonts/manrope-latin-700-normal.woff',
} as const

export const FONT_FAMILY = "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Regla `:root` con la paleta como variables CSS (`--color-abyss`), para el `<head>`. */
export const TOKENS_CSS = `:root{${Object.entries(PALETTE)
  .map(([name, value]) => `--color-${name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}:${value}`)
  .join(';')};--font-sans:${FONT_FAMILY}}`
