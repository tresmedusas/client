<script lang="ts">
  import LeadIn from '$lib/lead-in.svelte'
  import { ABOUT, CONTACT_SECTION, HERO, HOW_WORK, SITE } from '$lib/content.js'
  import FounderDialog from '$lib/founder-dialog.svelte'
  import { LOGO } from '$lib/tokens.js'
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
  <img class="hero-logo" src={LOGO.medusa.src} alt="" width="245" height="262" />
  <div class="hero-text">
    <h1><LeadIn text={HERO.title} /></h1>
    <p class="lead"><LeadIn text={HERO.lead} /></p>
    <p class="actions">
      <a class="button deep with-lens" href={HERO.primary.href}>
        <span class="lens" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
        </span>{HERO.primary.label}
      </a>
    </p>
  </div>
</section>

<section id={HOW_WORK.section.id} aria-labelledby="{HOW_WORK.section.id}-title">
  <p class="eyebrow">{HOW_WORK.section.index} — {HOW_WORK.section.label}</p>
  <h2 id="{HOW_WORK.section.id}-title"><LeadIn text={HOW_WORK.section.title} /></h2>
  <p><LeadIn text={HOW_WORK.section.intro} /></p>
  <ol class="steps">
    {#each HOW_WORK.steps as step (step.title)}
      <li>
        <img src={step.figure} alt="" width="640" height="427" loading="lazy" />
        <h3>{step.title}</h3>
        <p><LeadIn text={step.body} /></p>
      </li>
    {/each}
  </ol>
</section>

<section id={ABOUT.section.id} aria-labelledby="{ABOUT.section.id}-title">
  <p class="eyebrow">{ABOUT.section.index} — {ABOUT.section.label}</p>
  <h2 id="{ABOUT.section.id}-title"><LeadIn text={ABOUT.section.title} /></h2>
  <p><LeadIn text={ABOUT.section.intro} /></p>
  <h3 class="label">{ABOUT.foundersLabel}</h3>
  <ul class="cards founders">
    {#each ABOUT.founders as person (person.id)}
      <li id={person.id}>
        {#if person.photo}<img class="portrait" src={person.photo} alt="" width="240" height="336" loading="lazy" />{/if}
        <p class="eyebrow">{ABOUT.card.label}</p>
        <h4>{person.name}</h4>
        <p class="role">{person.role}</p>
        <p><LeadIn text={person.bio} /></p>
        <!-- Con JS abre el modal del fundador; la escena le dibuja el foco a su card. -->
        <a
          class="more"
          href="#{person.id}"
          onclick={(e) => {
            e.preventDefault()
            openFounder(person.id)
          }}>{ABOUT.card.cta(person.name)}</a
        >
      </li>
    {/each}
  </ul>
  <FounderDialog />
</section>

<section id={CONTACT_SECTION.section.id} aria-labelledby="{CONTACT_SECTION.section.id}-title">
  <p class="eyebrow">{CONTACT_SECTION.section.index} — {CONTACT_SECTION.section.label}</p>
  <h2 id="{CONTACT_SECTION.section.id}-title"><LeadIn text={CONTACT_SECTION.section.title} /></h2>
  <p><LeadIn text={CONTACT_SECTION.section.intro} /></p>
  <p class="actions">
    <a class="button" href={CONTACT_SECTION.primary.href} rel="noopener" target="_blank">{CONTACT_SECTION.primary.label}</a>
    <a class="button secondary" href={CONTACT_SECTION.secondary.href}>{CONTACT_SECTION.secondary.label}</a>
    <a class="button secondary" href={CONTACT_SECTION.tertiary.href} rel="noopener" target="_blank">{CONTACT_SECTION.tertiary.label}</a>
  </p>
</section>
