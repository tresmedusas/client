import { describe, expect, it } from 'vitest'
import { HOME_SCENES, pageOf, scenesOf, SHOWCASE_SCENES, TERMS_SCENES } from './content.js'

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
})
