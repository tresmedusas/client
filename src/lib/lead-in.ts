/**
 * Lead-in text highlight (ver DESIGN.md): la primera oración de un párrafo va
 * en `ink` y el resto en `muted`, con el mismo peso. Se aplica igual en la
 * escena (tramos de color de troika) y en la capa semántica (`<span>`).
 *
 * El lead-in sale del texto: es la primera oración, cerrada por `.`, `?`, `!`
 * o `:` seguido de un espacio. Si no hay una oración corta al principio, el
 * párrafo va sin resaltar: mejor nada que media línea en negro.
 */

/** Largo máximo del lead-in, en caracteres. */
export const LEAD_IN_MAX = 72

export interface LeadIn {
  /** La oración resaltada, con su puntuación. Vacía si el párrafo no tiene lead-in. */
  lead: string
  /** El resto, con el espacio inicial: `lead + rest === text`. */
  rest: string
}

export function leadIn(text: string): LeadIn {
  const match = /[.?!:](?=\s)/.exec(text)
  if (!match) return { lead: '', rest: text }
  const end = match.index + 1
  const rest = text.slice(end)
  // Un párrafo de una sola oración, o una primera oración larga, no se resalta.
  if (end > LEAD_IN_MAX || rest.trim() === '') return { lead: '', rest: text }
  return { lead: text.slice(0, end), rest }
}
