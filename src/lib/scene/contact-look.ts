/**
 * Contacto «desempañado» (pedido del usuario, 2026-11-27, propuesta A): al
 * llegar con el scroll, un vidrio esmerilado cubre todo el componente y el
 * contenido llega fuera de foco, un poco más grande. Con el scroll se aclara
 * y queda nítido justo cuando el componente llena la pantalla.
 */
export interface ContactFrost {
  /** Esmerilado del vidrio con Contacto recién entrando, en px. */
  blur: number
  /** Velo de papel del vidrio con Contacto recién entrando (0 a 1). */
  veil: number
  /** Cuánto más grande llega el contenido (0.06: un 6 %). */
  zoom: number
}

export const CONTACT_FROST: ContactFrost = {
  blur: 28,
  veil: 0.45,
  zoom: 0.06,
}

/**
 * Cuánto empañado hay según dónde va la escena (`d` de `SceneSlot`: −1,
 * abajo, por entrar; 0, en pantalla; positivo, ya pasó): 1 al entrar, 0 al
 * llenar la pantalla, con una curva suave en los dos extremos. Al irse hacia
 * arriba no se empaña.
 */
export function frostAmount(d: number): number {
  const t = Math.min(1, Math.max(0, -d))
  return t * t * (3 - 2 * t)
}
