import { describe, expect, it } from 'vitest'
import { HERO, SHOWCASE } from '$lib/content.js'
import { FADE_IN, FADE_OUT, HOLD, STEP, headlineAt, rotatingAt, rotatingInline, headlineText, headlineWords, variant, widestHeadline } from './headline.js'

const H = HERO.headline

describe('headline', () => {
  it('arranca con la primera combinación, en texto plano', () => {
    expect(headlineText(H)).toBe('Construimos el software que tu empresa necesita.')
  })

  it('cada paso cambia un solo grupo, alternando, y recorre las combinaciones', () => {
    const seen = new Set<string>()
    for (let k = 1; k <= 6; k++) {
      const a = variant(H, k - 1)
      const b = variant(H, k)
      expect(Number(a.what !== b.what) + Number(a.who !== b.who)).toBe(1)
      seen.add(`${b.what}-${b.who}`)
    }
    expect(seen.size).toBe(6)
  })

  it('el artículo concuerda con el sustantivo', () => {
    for (let k = 0; k < 6; k++) {
      const text = headlineText(H, k)
      expect(text).not.toMatch(/el identidad|la software|la diseño/)
    }
  })

  it('solo rotan (y van resaltadas) el artículo, el sustantivo y para quién', () => {
    const accent = headlineWords(H).filter((w) => w.accent).map((w) => w.key)
    expect(accent).toEqual(['article', 'noun', 'who'])
    expect(headlineWords(H).find((w) => w.breakBefore)?.text).toBe('que')
  })

  it('en un cambio, solo lo que cambia se desvanece y vuelve', () => {
    // Paso 1: cambia qué construimos (el software → la identidad).
    const out = headlineAt(H, STEP + FADE_OUT / 2)
    expect(out.find((w) => w.key === 'noun')).toMatchObject({ text: 'software' })
    expect(out.find((w) => w.key === 'noun')!.opacity).toBeLessThan(1)
    expect(out.find((w) => w.key === 'who')!.opacity).toBe(1)
    const back = headlineAt(H, STEP + HOLD)
    expect(back.find((w) => w.key === 'noun')).toMatchObject({ text: 'identidad', opacity: 1 })
    expect(back.find((w) => w.key === 'article')).toMatchObject({ text: 'la', opacity: 1 })
  })

  it('el más ancho usa las variantes más largas', () => {
    expect(widestHeadline(H)).toBe('Construimos la identidad\nque tu emprendimiento necesita.')
  })
})

describe('rotatingAt (el título del showcase)', () => {
  const T = SHOWCASE.headline

  it('arranca en la primera variante y la capa semántica dice lo mismo', () => {
    expect(rotatingAt(T, 0)).toEqual({ index: 0, opacity: 1 })
    expect(rotatingInline(T)).toBe(SHOWCASE.section.title)
  })

  it('en cada paso se desvanece la anterior y aparece la siguiente', () => {
    const out = rotatingAt(T, STEP + FADE_OUT / 2)
    expect(out.index).toBe(0)
    expect(out.opacity).toBeLessThan(1)
    expect(rotatingAt(T, STEP + FADE_OUT + FADE_IN)).toEqual({ index: 1, opacity: 1 })
  })

  it('recorre todas las variantes y vuelve a empezar', () => {
    const at = (k: number) => rotatingAt(T, k * STEP + HOLD / 2 + FADE_OUT + FADE_IN).index
    expect(T.words.map((_, k) => at(k))).toEqual(T.words.map((_, i) => i))
    expect(at(T.words.length)).toBe(0)
  })
})
