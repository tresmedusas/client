<script lang="ts">
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

<!-- Una sección por escena del deck, en el orden de SHOWCASE_SCENES. -->
<section id={SHOWCASE.section.id} class="hero" aria-labelledby="{SHOWCASE.section.id}-title">
  <p class="eyebrow">{SHOWCASE.section.label}</p>
  <h1 id="{SHOWCASE.section.id}-title"><LeadIn text={SHOWCASE.section.title} /></h1>
  <p class="lead"><LeadIn text={SHOWCASE.section.intro} /></p>
  <ol class="index">
    {#each SHOWCASE.projects as project (project.id)}
      <li><a href="#{project.id}">{project.name}</a></li>
    {/each}
  </ol>
</section>

{#each SHOWCASE.projects as project, i (project.id)}
  <section id={project.id} aria-labelledby="{project.id}-title">
    <p class="eyebrow">{String(i + 1).padStart(2, '0')} / {String(SHOWCASE.projects.length).padStart(2, '0')}</p>
    <h2 id="{project.id}-title"><LeadIn text={project.name} /></h2>
    <p>{[project.client, ...project.tags].join(' · ')}</p>
    {#if project.image}
      <img src={project.image} alt="" />
    {/if}
    <h3 class="label">{SHOWCASE.problemLabel}</h3>
    <p><LeadIn text={project.problem} /></p>
    <h3 class="label">{SHOWCASE.solutionLabel}</h3>
    <p><LeadIn text={project.solution} /></p>
  </section>
{/each}

<section id={SHOWCASE.closing.section.id} aria-labelledby="{SHOWCASE.closing.section.id}-title">
  <p class="eyebrow">{SHOWCASE.closing.section.label}</p>
  <h2 id="{SHOWCASE.closing.section.id}-title"><LeadIn text={SHOWCASE.closing.section.title} /></h2>
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

  section .index {
    padding-left: 0;
    list-style-position: inside;
  }

  section .actions {
    justify-content: center;
  }
</style>
