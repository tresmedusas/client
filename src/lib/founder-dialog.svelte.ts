/**
 * Qué fundador tiene el modal abierto. Lo abren la card de la escena y el
 * botón de la capa semántica; lo dibuja `founder-dialog.svelte`.
 */
export const founderDialog = $state<{ id: string | null }>({ id: null })

export function openFounder(id: string): void {
  founderDialog.id = id
}

export function closeFounder(): void {
  founderDialog.id = null
}
