<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { CONTACT_SECTION, DELIVERY, FOOTER, HERO, NAV, PROBLEMS, SITE, SITES } from '$lib/content.js'

  /** Año del build: el sitio se prerenderiza. */
  const YEAR = new Date().getFullYear()

  let layer = $state<HTMLElement>()
  let Stage = $state.raw<Component<{ layer: HTMLElement }> | null>(null)

  /**
   * El chequeo real del contexto: `app.html` solo mira si existe la API, porque
   * crear un contexto ahí bloquearía el primer paint de todos para cubrir un
   * caso raro (WebGL 2 en la lista negra del driver).
   */
  function canCreateContext(): boolean {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  }

  onMount(async () => {
    if (!canCreateContext()) {
      document.documentElement.classList.remove('canvas')
      return
    }
    try {
      // three, troika y Essentia no entran al HTML ni al primer JS: la página
      // se hidrata sin ellos, y el servidor nunca los importa.
      Stage = (await import('$lib/scene/stage.svelte')).default
    } catch (error) {
      console.error('No se pudo cargar la escena; queda el HTML.', error)
      document.documentElement.classList.remove('canvas')
    }
  })
</script>

<svelte:head>
  <title>{SITE.title}</title>
  <meta name="description" content={SITE.description} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={SITE.title} />
  <meta property="og:description" content={SITE.description} />
  <meta property="og:locale" content="es_MX" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<!--
  Capa semántica: con canvas sigue en el árbol de accesibilidad pero no se ve;
  sin WebGL es la página. Tiene exactamente el texto que dibuja la escena.
-->
<div bind:this={layer} class="semantic">
  <header>
    <a class="brand" href="#inicio">{SITE.name}</a>
    <nav aria-label="Principal">
      {#each NAV as link (link.href)}
        <a href={link.href}>{link.label}</a>
      {/each}
    </nav>
  </header>

  <main>
    <section id="inicio" class="hero">
      <p class="eyebrow">{HERO.eyebrow}</p>
      <h1>{HERO.title}</h1>
      <p class="lead">{HERO.lead}</p>
      <p class="actions">
        <a class="button" href={HERO.primary.href}>{HERO.primary.label}</a>
        <a class="button secondary" href={HERO.secondary.href}>{HERO.secondary.label}</a>
      </p>
    </section>

    <section id={PROBLEMS.section.id} aria-labelledby="{PROBLEMS.section.id}-title">
      <p class="eyebrow">{PROBLEMS.section.index} — {PROBLEMS.section.label}</p>
      <h2 id="{PROBLEMS.section.id}-title">{PROBLEMS.section.title}</h2>
      <p>{PROBLEMS.section.intro}</p>
      <ul class="cards">
        {#each PROBLEMS.items as item (item.title)}
          <li>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        {/each}
      </ul>
    </section>

    <section id={DELIVERY.section.id} aria-labelledby="{DELIVERY.section.id}-title">
      <p class="eyebrow">{DELIVERY.section.index} — {DELIVERY.section.label}</p>
      <h2 id="{DELIVERY.section.id}-title">{DELIVERY.section.title}</h2>
      <p>{DELIVERY.section.intro}</p>
      <ol class="steps">
        {#each DELIVERY.steps as step (step.title)}
          <li>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        {/each}
      </ol>
      <p>{DELIVERY.note}</p>
      <div class="evidence">
        <h3>{DELIVERY.evidence.title}</h3>
        <p>{DELIVERY.evidence.body}</p>
      </div>
    </section>

    <section id={SITES.section.id} aria-labelledby="{SITES.section.id}-title">
      <p class="eyebrow">{SITES.section.index} — {SITES.section.label}</p>
      <h2 id="{SITES.section.id}-title">{SITES.section.title}</h2>
      <p>{SITES.section.intro}</p>
      <p class="actions"><a class="button secondary" href={SITES.action.href}>{SITES.action.label}</a></p>
    </section>

    <section id={CONTACT_SECTION.section.id} aria-labelledby="{CONTACT_SECTION.section.id}-title">
      <p class="eyebrow">{CONTACT_SECTION.section.index} — {CONTACT_SECTION.section.label}</p>
      <h2 id="{CONTACT_SECTION.section.id}-title">{CONTACT_SECTION.section.title}</h2>
      <p>{CONTACT_SECTION.section.intro}</p>
      <p class="actions">
        <a class="button" href={CONTACT_SECTION.primary.href}>{CONTACT_SECTION.primary.label}</a>
        <a class="button secondary" href={CONTACT_SECTION.secondary.href} rel="noopener" target="_blank">{CONTACT_SECTION.secondary.label}</a>
      </p>
    </section>
  </main>

  <footer>
    <p class="brand">{SITE.name}</p>
    <p>{FOOTER.tagline}</p>
    <p>{FOOTER.copyright(YEAR)}</p>
  </footer>
</div>

{#if Stage && layer}
  <Stage {layer} />
{/if}
