import { error } from '@sveltejs/kit'
import { SHOWCASE } from '$lib/content.js'
import type { EntryGenerator, PageLoad } from './$types'

/** Una página por caso, prerenderizada. */
export const entries: EntryGenerator = () => SHOWCASE.projects.map((project) => ({ id: project.id }))

export const load: PageLoad = ({ params }) => {
  const project = SHOWCASE.projects.find((p) => p.id === params.id)
  if (!project) error(404, 'No existe ese caso.')
  return { project }
}
