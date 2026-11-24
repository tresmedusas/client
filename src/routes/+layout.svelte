<script lang="ts">
  import { onMount, type Component, type Snippet } from 'svelte'
  import { page } from '$app/state'
  import { FOOTER, NAV, SITE } from '$lib/content.js'
  import { FONT, LOGO, TOKENS_CSS } from '$lib/tokens.js'
  import '../app.css'

  let { children }: { children: Snippet } = $props()

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
      // se hidrata sin ellos, y el servidor nunca los importa. El stage vive en
      // el layout: pasar de la home al showcase no recrea el contexto WebGL.
      Stage = (await import('$lib/scene/stage.svelte')).default
    } catch (error) {
      console.error('No se pudo cargar la escena; queda el HTML.', error)
      document.documentElement.classList.remove('canvas')
    }
  })
</script>

<svelte:head>
  <!-- Variables de tokens.ts, prerenderizadas para el primer paint. -->
  {@html `<style>${TOKENS_CSS}</style>`}
  <!-- La escena no dibuja nada hasta tener el texto: las fuentes no esperan al JS. -->
  <link rel="preload" href={FONT.regular} as="font" type="font/woff" crossorigin="anonymous" />
  <link rel="preload" href={FONT.bold} as="font" type="font/woff" crossorigin="anonymous" />
  <link rel="preload" href={FONT.black} as="font" type="font/woff" crossorigin="anonymous" />
  <meta property="og:locale" content="es_MX" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<!--
  Capa semántica: con canvas sigue en el árbol de accesibilidad pero no se ve;
  sin WebGL es la página. Tiene exactamente el texto que dibuja la escena.
-->
<div bind:this={layer} class="semantic">
  <header>
    <a class="brand" href="/">
      <img src={LOGO.isotipoNegro.src} alt={SITE.name} width="25" height="28" />
    </a>
    <nav aria-label="Principal">
      {#each NAV as link (link.href)}
        <a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a>
      {/each}
    </nav>
  </header>

  <main>
    {@render children()}
  </main>

  <footer>
    <p class="brand-name">{SITE.name}</p>
    <p>{FOOTER.tagline}</p>
    <p>{FOOTER.copyright(YEAR)}</p>
  </footer>
</div>

{#if Stage && layer}
  <Stage {layer} />
{/if}
