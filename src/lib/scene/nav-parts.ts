// Piezas de la navbar (`nav.svelte`): resortes, íconos, links y el vidrio de las gotas.
import { NAV, type Link } from '$lib/content.js'

/** Resorte de segundo orden: `omega` en rad/s; `zeta` < 1 rebota. */
export type Osc = { x: number; v: number }

export const osc = (x = 0): Osc => ({ x, v: 0 })

export function stepOsc(o: Osc, target: number, omega: number, zeta: number, dt: number): void {
  const n = Math.max(1, Math.ceil(dt * 240))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    o.v += (omega * omega * (target - o.x) - 2 * zeta * omega * o.v) * h
    o.x += o.v * h
  }
}

/** Llegó a `target` y casi no se mueve. */
export const still = (o: Osc, target: number, eps = 0.05): boolean => Math.abs(o.x - target) < eps && Math.abs(o.v) < eps * 4

export function snap(o: Osc, x: number): void {
  o.x = x
  o.v = 0
}

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
export const smoothstep = (t: number): number => {
  const c = clamp01(t)
  return c * c * (3 - 2 * c)
}
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Separación del borde de abajo de la ventana. */
export const NAV_MARGIN = 16

const ICONS: Record<string, string> = {
  '/#como-trabajamos': 'nav-como-trabajamos',
  '/#nosotros': 'nav-nosotros',
  '/showcase': 'nav-showcase',
  '/#contacto': 'nav-contacto',
}

/** Ícono de un link (de línea, o sólido para el activo). */
export const navIcon = (href: string, solid = false): string => `/icons/${ICONS[href] ?? ICONS['/showcase']}${solid ? '-solid' : ''}.svg`

/** En un teléfono entran el showcase y el contacto. */
export const navLinks = (compact: boolean): readonly Link[] =>
  compact ? NAV.filter((l) => l.href === '/showcase' || l.href === '/#contacto') : NAV

/** El vidrio claro de las gotas, tuneado en el playground de crystal. */
export const NAV_GLASS = {
  profile: 'dome',
  bevelWidth: 20,
  bevelDepth: 13,
  lip: 4,
  lipSharpness: 8,
  thickness: 30,
  ior: 1.5,
  refraction: 1.15,
  dispersion: 0.15,
  magnify: 0.92,
  blur: 6,
  edgeSharpness: 0,
  tint: '#f0f0f0',
  tintOpacity: 0.4,
  tintMode: 'overlay',
  brightness: 0.2,
  saturation: 0.8,
  reflection: 0.05,
  specular: 0.5,
  rim: 0.01,
  softness: 0,
  shadowOpacity: 0.01,
  shadowSpread: 12,
  shadowOffsetY: 2,
  tilt: 0.5,
  surfaceRoughness: 0,
} as const

/** Posición del puntero en coordenadas de la escena (origen al centro, y hacia arriba). */
export function scenePointer(e: PointerEvent, viewport: { width: number; height: number }): { x: number; y: number } {
  return { x: e.clientX - viewport.width / 2, y: viewport.height / 2 - e.clientY }
}
