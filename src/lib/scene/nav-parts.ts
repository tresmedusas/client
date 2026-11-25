// Piezas de la navbar (`nav.svelte`): resortes, íconos, links y el vidrio de la barra.
import { NAV, type Link } from '$lib/content.js'

/** Resorte de segundo orden: `omega` en rad/s; `zeta` < 1 rebota. */
export type Osc = { x: number; v: number }

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

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))

/**
 * Propuestas del activo de la navbar de islas (temporal, se elige con `?nav=`):
 * `islas` el lente actual; `isla` el activo se separa en su propia isla;
 * `gota` una gota de tinta colgando bajo el activo; `tinta` un lente oscuro con
 * el ícono y el texto en blanco.
 */
export type NavVariant = 'islas' | 'isla' | 'gota' | 'tinta'
export const NAV_VARIANTS: readonly NavVariant[] = ['islas', 'isla', 'gota', 'tinta']

/** Separación del borde de arriba de la ventana. */
export const NAV_MARGIN = 16

const ICONS: Record<string, string> = {
  '/#como-trabajamos': 'nav-como-trabajamos',
  '/#nosotros': 'nav-nosotros',
  '/showcase': 'nav-showcase',
  '/#contacto': 'nav-contacto',
}

/** Ícono de un link (de línea, o sólido para el activo; `paper`: sólido en blanco). */
export const navIcon = (href: string, solid: boolean | 'paper' = false): string =>
  `/icons/${ICONS[href] ?? ICONS['/showcase']}${solid === 'paper' ? '-solid-paper' : solid ? '-solid' : ''}.svg`

/** En un teléfono entran el showcase y el contacto. */
export const navLinks = (compact: boolean): readonly Link[] =>
  compact ? NAV.filter((l) => l.href === '/showcase' || l.href === '/#contacto') : NAV

/**
 * Vidrio de la pastilla y de la burbuja del logo: el perfil de `crystal` con
 * un tinte claro, ajustado por el usuario en el banco de pruebas (`?tune`).
 */
export const NAV_GLASS = {
  profile: 'dome',
  bevelWidth: 20,
  bevelDepth: 13,
  lip: 6,
  lipSharpness: 10,
  thickness: 30,
  ior: 1.5,
  refraction: 1.15,
  dispersion: 0.15,
  magnify: 0.92,
  blur: 4.5,
  edgeSharpness: 0,
  tint: '#f0f0f0',
  tintOpacity: 0.6,
  tintMode: 'overlay',
  brightness: 0.38,
  saturation: 0.8,
  reflection: 0.05,
  specular: 0.5,
  rim: 0.02,
  softness: 0,
  shadowOpacity: 0.03,
  shadowSpread: 8,
  shadowOffsetY: 1,
  tilt: 0.5,
  surfaceRoughness: 0,
} as const
