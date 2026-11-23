<script lang="ts">
  import LeadIn from '$lib/lead-in.svelte'
  import { TERMS } from '$lib/content.js'
</script>

<svelte:head>
  <title>{TERMS.title}</title>
  <meta name="description" content={TERMS.description} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={TERMS.title} />
  <meta property="og:description" content={TERMS.description} />
</svelte:head>

<!-- Una sola escena, como TERMS_SCENES. Página de ejemplo hasta tener el texto legal. -->
<section id={TERMS.section.id} class="terms" aria-labelledby="{TERMS.section.id}-title">
  <p class="eyebrow">{TERMS.section.label}</p>
  <h1 id="{TERMS.section.id}-title"><LeadIn text={TERMS.section.title} /></h1>
  {#if TERMS.section.intro}<p class="lead"><LeadIn text={TERMS.section.intro} /></p>{/if}
  {#each TERMS.items as item (item.title)}
    <h2>{item.title}</h2>
    <p><LeadIn text={item.body} /></p>
  {/each}
</section>

<style>
  /* Centrado por convención (DESIGN.md, sección 6), como la escena; medida corta para leer. */
  .terms {
    text-align: center;
  }

  .terms p {
    max-width: 34rem;
    margin-inline: auto;
  }

  .terms h2 {
    font-size: 1.2rem;
    margin-top: 2.5rem;
  }
</style>
