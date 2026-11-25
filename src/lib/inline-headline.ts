/**
 * Titular inline (ver DESIGN.md §3), el del hero llevado a los demás títulos:
 * el texto va en `muted` y regular, y las palabras que cuentan, en `ink` y
 * black. Se aplica igual en la escena (`scene/inline-headline.svelte`, una
 * palabra por texto de troika) y en la capa semántica (`inline-headline.svelte`).
 *
 * Las palabras destacadas se marcan en el contenido con `**…**`:
 * «Primero, **el problema.** Después, la herramienta.». Sin marcas, se
 * destaca el lead-in (la primera oración); si tampoco hay, el título entero.
 */

import { leadIn } from './lead-in.js'

export interface HeadlinePart {
  text: string
  accent: boolean
}

/** Tramos del título, en orden, sin las marcas: `parts.map((p) => p.text).join('')` es el texto limpio. */
export function headlineParts(text: string): HeadlinePart[] {
  if (text.includes('**')) {
    return text
      .split('**')
      .map((piece, i) => ({ text: piece, accent: i % 2 === 1 }))
      .filter((part) => part.text !== '')
  }
  const { lead, rest } = leadIn(text)
  if (lead) return [{ text: lead, accent: true }, { text: rest, accent: false }]
  return [{ text, accent: true }]
}

/** El título sin marcas, para lo que no lleva estilo (metadatos, `aria-label`). */
export function headlinePlain(text: string): string {
  return text.replaceAll('**', '')
}

/** Un tramo de una palabra: la palabra puede cambiar de estilo sin espacio en el medio («problema» + «.»). */
export interface HeadlinePiece {
  text: string
  accent: boolean
}

/** Las palabras del título (separadas por espacios), cada una con sus tramos: lo que acomoda la escena. */
export function headlineTokens(text: string): HeadlinePiece[][] {
  const words: HeadlinePiece[][] = []
  let open = false
  for (const part of headlineParts(text)) {
    part.text.split(/(\s+)/).forEach((chunk) => {
      if (chunk === '') return
      if (/^\s+$/.test(chunk)) {
        open = false
        return
      }
      if (open) words.at(-1)!.push({ text: chunk, accent: part.accent })
      else words.push([{ text: chunk, accent: part.accent }])
      open = true
    })
  }
  return words
}
