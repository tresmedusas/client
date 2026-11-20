<script lang="ts">
  // Modal de un fundador (primera versión): pantalla completa, fondo oscuro y
  // un haz de luz. Es un <dialog> nativo en la capa semántica, así que el foco,
  // Escape y el lector de pantalla funcionan igual con o sin la escena; queda
  // en la capa superior del navegador, por encima del canvas.
  import { ABOUT } from '$lib/content.js'
  import { closeFounder, founderDialog } from '$lib/founder-dialog.svelte.js'
  import LeadIn from '$lib/lead-in.svelte'
  import { lightBeam, type LightBeam } from '$lib/light-beam.js'
  import { PALETTE } from '$lib/tokens.js'

  let dialog = $state<HTMLDialogElement>()
  let canvas = $state<HTMLCanvasElement>()

  const person = $derived(ABOUT.founders.find((f) => f.id === founderDialog.id) ?? null)

  // Abre y cierra el <dialog> con el estado (la card de la escena o el link).
  $effect(() => {
    if (!dialog) return
    if (person && !dialog.open) dialog.showModal()
    else if (!person && dialog.open) dialog.close()
  })

  // El haz corre solo mientras el modal está abierto.
  $effect(() => {
    if (!person || !canvas) return
    const beam: LightBeam | null = lightBeam(canvas, PALETTE.ink)
    if (!beam) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      // Se enciende en ~1.4 s; con movimiento reducido, quieto y entero.
      const open = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.4), 3)
      beam.draw(reduced ? 0 : t, open)
      if (!reduced) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      beam.destroy()
    }
  })
</script>

<!-- Las teclas no salen del modal: el deck no se mueve detrás. Escape lo cierra (nativo). -->
<dialog
  bind:this={dialog}
  class="founder-dialog"
  aria-labelledby="founder-dialog-name"
  onclose={closeFounder}
  onkeydown={(e) => e.stopPropagation()}
  onwheel={(e) => e.stopPropagation()}
>
  {#if person}
    <canvas bind:this={canvas} class="beam" aria-hidden="true"></canvas>
    <p class="ghost" aria-hidden="true">{person.name}</p>
    <form method="dialog" class="close">
      <button type="submit">{ABOUT.card.close}</button>
    </form>
    <div class="content">
      <p class="eyebrow">{ABOUT.card.label}</p>
      <h2 id="founder-dialog-name">{person.name}</h2>
      <p class="role">{person.role}</p>
      <p class="bio"><LeadIn text={person.bio} /></p>
    </div>
  {/if}
</dialog>

<style>
  .founder-dialog {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    background: var(--color-ink);
    color: var(--color-white);
    font-family: var(--font-sans);
    text-align: center;
  }

  .founder-dialog[open] {
    animation: open 0.45s ease-out;
  }

  .founder-dialog::backdrop {
    background: var(--color-ink);
  }

  @keyframes open {
    from {
      opacity: 0;
      transform: scale(1.015);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .founder-dialog[open] {
      animation: none;
    }
  }

  .beam {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* El nombre gigante en contorno, detrás del haz (como la marca de la referencia). */
  .ghost {
    position: absolute;
    left: 50%;
    top: 66%;
    margin: 0;
    transform: translate(-50%, -50%);
    font-size: clamp(4rem, 15vw, 15rem);
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.03em;
    white-space: nowrap;
    color: transparent;
    -webkit-text-stroke: 1px color-mix(in srgb, var(--color-white) 16%, transparent);
    pointer-events: none;
    user-select: none;
  }

  .close {
    position: absolute;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
  }

  .close button {
    padding: 0.55rem 1.1rem;
    border: 0;
    border-radius: 999px;
    background: var(--color-white);
    color: var(--color-ink);
    font: 700 0.85rem/1 var(--font-sans);
    cursor: pointer;
  }

  .close button:focus-visible {
    outline: 2px solid var(--color-white);
    outline-offset: 3px;
  }

  .content {
    position: absolute;
    left: 50%;
    top: 14%;
    width: min(36rem, calc(100% - 2rem));
    transform: translateX(-50%);
  }

  .eyebrow {
    margin: 0 0 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--color-white) 55%, transparent);
  }

  h2 {
    margin: 0;
    font-size: clamp(2.25rem, 6vw, 3.75rem);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .role {
    margin: 0.75rem 0 1.5rem;
    font-size: 0.95rem;
    color: color-mix(in srgb, var(--color-white) 60%, transparent);
  }

  .bio {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.6;
  }

  /* Lead-in sobre el fondo oscuro: la primera oración en blanco, el resto apagado. */
  .bio :global(.lead-in) {
    color: var(--color-white);
  }

  .bio :global(.lead-in-rest) {
    color: color-mix(in srgb, var(--color-white) 60%, transparent);
  }
</style>
