<script lang="ts">
  import type { Snippet } from 'svelte'
  import { FONT, TOKENS_CSS } from '$lib/tokens.js'
  import '../app.css'

  let { children }: { children: Snippet } = $props()
</script>

<svelte:head>
  <!-- Variables de tokens.ts, prerenderizadas para el primer paint. -->
  {@html `<style>${TOKENS_CSS}</style>`}
  <!-- La escena no dibuja nada hasta tener el texto: las fuentes no esperan al JS. -->
  <link rel="preload" href={FONT.regular} as="font" type="font/woff" crossorigin="anonymous" />
  <link rel="preload" href={FONT.semibold} as="font" type="font/woff" crossorigin="anonymous" />
  <link rel="preload" href={FONT.bold} as="font" type="font/woff" crossorigin="anonymous" />
</svelte:head>

{@render children()}
