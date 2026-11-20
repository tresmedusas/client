<script lang="ts">
  // Lead-in en la capa semántica: la primera oración en `ink`, el resto en
  // `muted` (estilos `.lead-in` en app.css). Ver DESIGN.md.
  import { leadIn } from './lead-in.js'

  let { text }: { text: string } = $props()

  const parts = $derived(leadIn(text))
</script>

{#if parts.lead}<span class="lead-in">{parts.lead}</span><span class="lead-in-rest">{parts.rest}</span>{:else}{text}{/if}
