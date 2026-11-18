<script lang="ts">
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
  <h1 id="{SHOWCASE.section.id}-title">{SHOWCASE.section.title}</h1>
  <p class="lead">{SHOWCASE.section.intro}</p>
  <ol class="index">
    {#each SHOWCASE.projects as project (project.id)}
      <li><a href="#{project.id}">{project.name}</a></li>
    {/each}
  </ol>
</section>

{#each SHOWCASE.projects as project, i (project.id)}
  <section id={project.id} aria-labelledby="{project.id}-title">
    <p class="eyebrow">{String(i + 1).padStart(2, '0')} / {String(SHOWCASE.projects.length).padStart(2, '0')}</p>
    <h2 id="{project.id}-title">{project.name}</h2>
    <p>{project.client} · {project.tags.join(', ')}</p>
    {#if project.image}
      <img src={project.image} alt="" />
    {/if}
    <h3 class="label">{SHOWCASE.problemLabel}</h3>
    <p>{project.problem}</p>
    <h3 class="label">{SHOWCASE.solutionLabel}</h3>
    <p>{project.solution}</p>
  </section>
{/each}

<section id={SHOWCASE.closing.section.id} aria-labelledby="{SHOWCASE.closing.section.id}-title">
  <p class="eyebrow">{SHOWCASE.closing.section.label}</p>
  <h2 id="{SHOWCASE.closing.section.id}-title">{SHOWCASE.closing.section.title}</h2>
  <p>{SHOWCASE.closing.section.intro}</p>
  <p class="actions">
    <a class="button" href={SHOWCASE.closing.primary.href} rel="noopener" target="_blank">{SHOWCASE.closing.primary.label}</a>
    <a class="button secondary" href={SHOWCASE.closing.secondary.href}>{SHOWCASE.closing.secondary.label}</a>
  </p>
</section>
