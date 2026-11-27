<script lang="ts">
  import InlineHeadline from '$lib/inline-headline.svelte'
  import LeadIn from '$lib/lead-in.svelte'
  import { ABOUT, CONTACT_SECTION, HERO, HOW_WORK, SITE } from '$lib/content.js'
  import FounderDialog from '$lib/founder-dialog.svelte'
  import HeroFigure from '$lib/hero-figure.svelte'
  import { headlineWords } from '$lib/scene/headline.js'
  import { openFounder } from '$lib/founder-dialog.svelte.js'
</script>

<svelte:head>
  <title>{SITE.title}</title>
  <meta name="description" content={SITE.description} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={SITE.title} />
  <meta property="og:description" content={SITE.description} />
</svelte:head>

<!-- Una sección por escena del deck, en el orden de HOME_SCENES. -->
<section id={HERO.id} class="hero">
  <!-- Como en la escena, quieto en la primera combinación: el texto fijo en `muted` y lo que rota en `ink`. -->
  <h1>
    {#each headlineWords(HERO.headline) as w, i (w.key)}{i > 0 ? ' ' : ''}{#if w.accent}<strong>{w.text}</strong>{:else}{w.text}{/if}{/each}
  </h1>
  <p class="actions">
    <a class="button deep with-lens" href={HERO.primary.href}>
      <span class="lens" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
      </span>{HERO.primary.label}
    </a>
  </p>
  <HeroFigure />
</section>

<section id={HOW_WORK.section.id} aria-labelledby="{HOW_WORK.section.id}-title">
  <h2 id="{HOW_WORK.section.id}-title"><InlineHeadline text={HOW_WORK.section.title} /></h2>
  <p><LeadIn text={HOW_WORK.section.intro} /></p>
  <ol class="steps">
    {#each HOW_WORK.steps as step (step.title)}
      <li>
        <img src={step.figure} alt="" width="640" height="427" loading="lazy" />
        <h3><InlineHeadline text={step.title} /></h3>
        <p><LeadIn text={step.body} /></p>
      </li>
    {/each}
  </ol>
</section>

<section id={ABOUT.section.id} aria-labelledby="{ABOUT.section.id}-title">
  <h2 id="{ABOUT.section.id}-title"><InlineHeadline text={ABOUT.section.title} /></h2>
  <h3 class="label">{ABOUT.foundersLabel}</h3>
  <ul class="cards founders">
    {#each ABOUT.founders as person (person.id)}
      <li id={person.id}>
        {#if person.photo}<img class="portrait" src={person.photo} alt="" width="240" height="336" loading="lazy" />{/if}
        <p class="eyebrow">{person.label}</p>
        <!-- El nombre abre el modal del fundador (con JS); la escena le dibuja el foco a su card. -->
        <h4>
          <a
            href="#{person.id}"
            onclick={(e) => {
              e.preventDefault()
              openFounder(person.id)
            }}>{person.name}</a
          >
        </h4>
        <p class="role">{person.role}</p>
        <p><LeadIn text={person.bio} /></p>
      </li>
    {/each}
  </ul>
  <FounderDialog />
</section>

<section id={CONTACT_SECTION.section.id} aria-labelledby="{CONTACT_SECTION.section.id}-title">
  <h2 id="{CONTACT_SECTION.section.id}-title"><InlineHeadline text={CONTACT_SECTION.section.title} /></h2>
  <p><LeadIn text={CONTACT_SECTION.section.intro} /></p>
  <p class="actions">
    <a class="button deep with-lens" href={CONTACT_SECTION.primary.href} rel="noopener" target="_blank">
      <span class="lens" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
      </span>{CONTACT_SECTION.primary.label}
    </a>
    <a class="button secondary" href={CONTACT_SECTION.secondary.href}>{CONTACT_SECTION.secondary.label}</a>
  </p>
</section>
