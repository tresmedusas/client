import { describe, expect, it } from 'vitest'
import { ABOUT, CASE_SCENES, CONTACT_SECTION, HOME_SCENES, caseHref, caseOf, caseSection, HOW_WORK, pageOf, scenesOf, SHOWCASE, SHOWCASE_SCENES, TERMS_SCENES, type Section } from './content.js'
import { headlineParts } from './inline-headline.js'
import { leadIn } from './lead-in.js'

describe('pageOf', () => {
  it('reconoce cada página, con o sin barra final', () => {
    expect(pageOf('/')).toBe('home')
    expect(pageOf('/showcase/')).toBe('showcase')
    expect(pageOf('/terminos')).toBe('terms')
  })
})

describe('scenesOf', () => {
  it('da las escenas de cada página', () => {
    expect(scenesOf('/')).toBe(HOME_SCENES)
    expect(scenesOf('/showcase')).toBe(SHOWCASE_SCENES)
    expect(scenesOf('/terminos/')).toBe(TERMS_SCENES)
  })

  it('cada caso tiene su página en /showcase/{id}', () => {
    for (const project of SHOWCASE.projects) {
      expect(pageOf(caseHref(project.id))).toBe('case')
      expect(scenesOf(`${caseHref(project.id)}/`)).toBe(CASE_SCENES)
      expect(caseOf(caseHref(project.id))).toBe(project)
    }
    expect(caseOf('/showcase/no-existe')).toBeUndefined()
    expect(pageOf('/showcase/no-existe')).toBe('home')
  })
})

describe('encabezados de sección', () => {
  const sections: Section[] = [HOW_WORK.section, ABOUT.section, CONTACT_SECTION.section, SHOWCASE.section, SHOWCASE.closing.section]

  it('llevan titular inline (tramos destacados y apagados) y lead-in en la intro, si la tienen (DESIGN.md §3)', () => {
    for (const section of sections) {
      const parts = headlineParts(section.title)
      expect(parts.some((p) => p.accent), section.title).toBe(true)
      expect(parts.some((p) => !p.accent && p.text.trim() !== ''), section.title).toBe(true)
      if (section.intro) expect(leadIn(section.intro).lead, section.intro).not.toBe('')
    }
  })

  it('la página de un caso: el nombre como título (entero destacado) y el contexto con lead-in', () => {
    for (const project of SHOWCASE.projects) {
      const section = caseSection(project)
      expect(section.label).toBeUndefined()
      expect(headlineParts(section.title).every((p) => p.accent || p.text.trim() === '')).toBe(true)
      expect(leadIn(section.intro!).lead).not.toBe('')
    }
  })

  it('los pasos de Cómo trabajamos destacan una parte del título', () => {
    for (const step of HOW_WORK.steps) expect(step.title, step.title).toMatch(/\*\*.+\*\*/)
  })
})
