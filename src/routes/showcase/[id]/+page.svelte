<script lang="ts">
  import InlineHeadline from '$lib/inline-headline.svelte'
  import LeadIn from '$lib/lead-in.svelte'
  import { CASE_PAGE, SITE, caseSection } from '$lib/content.js'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const project = $derived(data.project)
  const section = $derived(caseSection(project))
  const preview = $derived(project.preview)
  const title = $derived(`${project.name} — ${SITE.name}`)
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={project.summary} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={project.summary} />
</svelte:head>

<!-- Una sola escena, como CASE_SCENES: volver al showcase, el nombre, el contexto y la previsualización. -->
<section id={section.id} class="case" aria-labelledby="{section.id}-title">
  <p class="back"><a href={CASE_PAGE.back.href}>← {CASE_PAGE.back.label}</a></p>
  <h1 id="{section.id}-title"><InlineHeadline text={section.title} /></h1>
  <p class="lead"><LeadIn text={project.summary} /></p>
  <img
    src={preview.src}
    alt={preview.alt}
    class:contain={preview.fit === 'contain'}
    class:top={preview.align === 'top'}
    class:deep={preview.background === 'deep'}
  />
</section>

<style>
  /* Centrado por convención (DESIGN.md, sección 6), como la escena. */
  .case {
    text-align: center;
  }

  .case .lead {
    max-width: 34rem;
    margin-inline: auto;
  }


  /* La previsualización como la card del showcase: 3:2 (4:5 en un teléfono), DESIGN.md §4. */
  img {
    display: block;
    width: min(100%, 990px);
    margin: 2.5rem auto;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
    border-radius: 16px;
    background: var(--color-paper);
  }

  @media (max-width: 759px) {
    img {
      aspect-ratio: 4 / 5;
    }
  }

  img.top {
    object-position: top;
  }

  img.contain {
    object-fit: contain;
    padding: 18%;
    box-sizing: border-box;
  }

  img.deep {
    background: var(--color-brand-deep);
  }
</style>
