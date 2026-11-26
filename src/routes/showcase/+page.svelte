<script lang="ts">
  import InlineHeadline from '$lib/inline-headline.svelte'
  import { SHOWCASE, caseHref } from '$lib/content.js'
</script>

<svelte:head>
  <title>{SHOWCASE.title}</title>
  <meta name="description" content={SHOWCASE.description} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={SHOWCASE.title} />
  <meta property="og:description" content={SHOWCASE.description} />
</svelte:head>

<!-- Una sección por escena del deck, en el orden de SHOWCASE_SCENES: la entrada con los casos (por ahora sin cierre). -->
<section id={SHOWCASE.section.id} class="hero" aria-labelledby="{SHOWCASE.section.id}-title">
  <h1 id="{SHOWCASE.section.id}-title"><InlineHeadline text={SHOWCASE.section.title} /></h1>
  <ul class="cases">
    {#each SHOWCASE.projects as project (project.id)}
      {@const preview = project.preview}
      <!-- Cada card abre la página del caso. -->
      <li id={project.id}>
        <a href={caseHref(project.id)}>
          <img
            src={preview.src}
            alt="{project.name}: {preview.alt}"
            class:contain={preview.fit === 'contain'}
            class:top={preview.align === 'top'}
            class:deep={preview.background === 'deep'}
          />
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  /* Centrado por convención (DESIGN.md, sección 6), como la escena. */
  section {
    text-align: center;
  }

  /* Sin WebGL, los casos van uno debajo del otro: cards 3:2 (4:5 en un teléfono) con la previsualización, sin texto (DESIGN.md §4). */
  .cases {
    display: grid;
    gap: 36px;
    justify-items: center;
    margin: 80px 0 0;
    padding: 0;
    list-style: none;
  }

  .cases li {
    width: min(90%, 990px);
  }

  .cases a {
    display: block;
    border-radius: 16px;
  }

  .cases img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
    border-radius: 16px;
    background: var(--color-paper);
  }

  @media (max-width: 759px) {
    .cases img {
      aspect-ratio: 4 / 5;
    }
  }

  .cases img.top {
    object-position: top;
  }

  .cases img.contain {
    object-fit: contain;
    padding: 18%;
    box-sizing: border-box;
  }

  .cases img.deep {
    background: var(--color-brand-deep);
  }
</style>
