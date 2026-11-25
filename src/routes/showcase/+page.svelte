<script lang="ts">
  import InlineHeadline from '$lib/inline-headline.svelte'
  import LeadIn from '$lib/lead-in.svelte'
  import { SHOWCASE } from '$lib/content.js'
</script>

<svelte:head>
  <title>{SHOWCASE.title}</title>
  <meta name="description" content={SHOWCASE.description} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={SHOWCASE.title} />
  <meta property="og:description" content={SHOWCASE.description} />
</svelte:head>

<!-- Una sección por escena del deck, en el orden de SHOWCASE_SCENES: la entrada con los casos, y el cierre. -->
<section id={SHOWCASE.section.id} class="hero" aria-labelledby="{SHOWCASE.section.id}-title">
  <h1 id="{SHOWCASE.section.id}-title"><InlineHeadline text={SHOWCASE.section.title} /></h1>
  <ul class="cases">
    {#each SHOWCASE.projects as project (project.id)}
      {@const preview = project.preview}
      <li id={project.id}>
        <img
          src={preview.src}
          alt="{project.name}: {preview.alt}"
          class:contain={preview.fit === 'contain'}
          class:top={preview.align === 'top'}
          class:deep={preview.background === 'deep'}
        />
      </li>
    {/each}
  </ul>
</section>

<section id={SHOWCASE.closing.section.id} aria-labelledby="{SHOWCASE.closing.section.id}-title">
  <p class="eyebrow">{SHOWCASE.closing.section.label}</p>
  <h2 id="{SHOWCASE.closing.section.id}-title"><InlineHeadline text={SHOWCASE.closing.section.title} /></h2>
  <p><LeadIn text={SHOWCASE.closing.section.intro} /></p>
  <p class="actions">
    <a class="button" href={SHOWCASE.closing.primary.href} rel="noopener" target="_blank">{SHOWCASE.closing.primary.label}</a>
    <a class="button secondary" href={SHOWCASE.closing.secondary.href}>{SHOWCASE.closing.secondary.label}</a>
  </p>
</section>

<style>
  /* Centrado por convención (DESIGN.md, sección 6), como la escena. */
  section {
    text-align: center;
  }

  section .actions {
    justify-content: center;
  }

  /* Los casos, uno debajo del otro: cards 4:5 con la previsualización, sin texto (DESIGN.md §4). */
  .cases {
    display: grid;
    gap: 36px;
    justify-items: center;
    margin: 80px 0 0;
    padding: 0;
    list-style: none;
  }

  .cases li {
    width: min(84%, 600px);
  }

  .cases img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    border: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
    border-radius: 16px;
    background: var(--color-paper);
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
