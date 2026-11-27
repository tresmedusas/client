import type { ViewportRect } from './founder-open.js'

/**
 * Qué fundador tiene el modal abierto. Lo abren la card de la escena y el
 * link de la capa semántica; lo dibuja `founder-dialog.svelte`.
 */
export const founderDialog = $state<{ id: string | null; from: ViewportRect | null }>({ id: null, from: null })

/** `from`: dónde está la card en la ventana, para abrir el modal desde ella (sin card, desde el link, no hay). */
export function openFounder(id: string, from: ViewportRect | null = null): void {
  founderDialog.from = from
  founderDialog.id = id
}

export function closeFounder(): void {
  founderDialog.id = null
}
