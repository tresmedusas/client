<script lang="ts">
  // Titular inline en la capa semántica, como el h1 del hero: el texto en
  // `muted` y regular, lo destacado en `<strong>` con `ink` y black (estilos
  // `.inline-headline` en app.css). Ver DESIGN.md §3.
  import { headlineParts } from './inline-headline.js'

  let { text }: { text: string } = $props()

  const parts = $derived(headlineParts(text))
</script>

<span class="inline-headline">{#each parts as part, i (i)}{#if part.accent}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</span>
