<script lang="ts">
  // Modal de un fundador (primera versión): pantalla completa, fondo oscuro y
  // un haz de luz. Es un <dialog> nativo en la capa semántica, así que el foco,
  // Escape y el lector de pantalla funcionan igual con o sin la escena; queda
  // en la capa superior del navegador, por encima del canvas.
  //
  // Se abre y se cierra con una de las aperturas de `founder-open.ts` (en
  // desarrollo, la del banco de pruebas), con Web Animations: al cerrar, la
  // misma al revés, y el <dialog> se cierra cuando termina.
  import { tick, untrack } from 'svelte'
  import { ABOUT, type Person } from '$lib/content.js'
  import { closeFounder, founderDialog } from '$lib/founder-dialog.svelte.js'
  import {
    CLOSE_SPEED,
    FOUNDER_OPEN,
    FOUNDER_STAGGER,
    OPEN_TIMING,
    STAGGER,
    cardClip,
    slitClip,
    type FounderOpen,
    type ViewportRect,
  } from '$lib/founder-open.js'
  import { founderLab } from '$lib/lab/founder-lab.svelte.js'
  import LeadIn from '$lib/lead-in.svelte'
  import { BEAM_HEIGHT, lightBeam, type LightBeam } from '$lib/light-beam.js'
  import { PALETTE } from '$lib/tokens.js'

  /** El radio de la card de la escena (`scene/founder-card.svelte`). */
  const CARD_RADIUS = 20
  /** La altura del haz, desde arriba. */
  const BEAM_TOP = 1 - BEAM_HEIGHT
  /** Largo del trazo del nombre gigante al dibujarse (px). */
  const GHOST_DASH = 1600

  let dialog = $state<HTMLDialogElement>()
  let canvas = $state<HTMLCanvasElement>()
  let photo = $state<HTMLImageElement>()
  let ghost = $state<SVGTextElement>()
  let content = $state<HTMLDivElement>()
  let closer = $state<HTMLButtonElement>()

  /** La apertura: en desarrollo, la del banco de pruebas. */
  const chosen = $derived<FounderOpen>(import.meta.env.DEV && founderLab ? founderLab.kind : FOUNDER_OPEN)
  const stagger = $derived(import.meta.env.DEV && founderLab ? founderLab.stagger : FOUNDER_STAGGER)
  const speed = $derived(import.meta.env.DEV && founderLab?.slow ? 0.2 : 1)

  const wanted = $derived(ABOUT.founders.find((f) => f.id === founderDialog.id) ?? null)
  /**
   * Lo que se ve. Queda en el <dialog> cerrado (que no se ve ni toma el foco):
   * sacarlo con el foco adentro dispara el `focusout` de la capa semántica en
   * pleno desmontaje.
   */
  let shown = $state<Person | null>(null)
  /** El modal está abierto: el haz corre. */
  let active = $state(false)
  /** Cuántas veces se abrió: cada apertura lleva un canvas nuevo (el haz libera su contexto al cerrar). */
  let opened = $state(0)
  /** La apertura en curso: sin card de origen (desde el link), `card` es un fundido. */
  let kind = $state<FounderOpen>('fade')
  let from: ViewportRect | null = null
  let closing = false
  /** Lo cerró `close()`: el evento `close` (que llega después) no tiene que hacer nada. */
  let closedHere = false
  let running: Animation[] = []

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /** Una animación; `back` la corre al revés (para cerrar), sin demora y más rápida. */
  function run(
    el: Element | undefined,
    frames: Keyframe[],
    o: { duration: number; delay?: number; easing?: string; pseudoElement?: string },
    back: boolean,
  ) {
    if (!el) return
    const rate = speed * (back ? CLOSE_SPEED : 1)
    const animation = el.animate(back ? [...frames].reverse() : frames, {
      duration: (o.duration * 1000) / rate,
      delay: back ? 0 : ((o.delay ?? 0) * 1000) / rate,
      easing: o.easing ?? 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: back ? 'forwards' : 'backwards',
      pseudoElement: o.pseudoElement,
    })
    running.push(animation)
  }

  /** Lo que abre (o, con `back`, cierra) el modal, según la apertura. */
  function animate(back: boolean) {
    const t = OPEN_TIMING[kind]
    const vw = window.innerWidth
    const vh = window.innerHeight
    const ink = PALETTE.ink
    const clear = `${PALETTE.ink}00`
    if (kind === 'card' && from) {
      const full = { left: 0, top: 0, width: vw, height: vh }
      run(dialog, [{ clipPath: cardClip(from, vw, vh, CARD_RADIUS) }, { clipPath: cardClip(full, vw, vh, 0) }], { duration: t.main }, back)
      // La foto de la card crece con el recorte y se apaga en la tinta.
      const box = (r: ViewportRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
      run(photo, [{ ...box(from), opacity: 1 }, { ...box(full), opacity: 0 }], { duration: t.main }, back)
    } else if (kind === 'slit') {
      run(dialog, [{ clipPath: slitClip(BEAM_TOP, false) }, { clipPath: slitClip(BEAM_TOP, true) }], { duration: t.main, delay: t.mainDelay, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' }, back)
    } else if (kind === 'frost') {
      // La página se esmerila y se oscurece; el modal llega transparente.
      run(dialog, [{ backdropFilter: 'blur(0px)', backgroundColor: clear }, { backdropFilter: 'blur(24px)', backgroundColor: `${PALETTE.ink}99` }], { duration: t.main, pseudoElement: '::backdrop' }, back)
      run(dialog, [{ backgroundColor: clear }, { backgroundColor: ink }], { duration: t.main, delay: t.mainDelay }, back)
      run(canvas, [{ opacity: 0 }, { opacity: 1 }], { duration: t.main, delay: t.mainDelay }, back)
      run(content, [{ filter: 'blur(14px)', scale: '1.06', opacity: 0 }, { filter: 'blur(0px)', scale: '1', opacity: 1 }], { duration: t.main, delay: t.content }, back)
    } else {
      // `fade` y `type`: el fundido de siempre (al cerrar, también se va el fondo).
      run(dialog, [{ opacity: 0, transform: 'scale(1.015)' }, { opacity: 1, transform: 'none' }], { duration: kind === 'type' ? 0.3 : t.main, easing: 'ease-out' }, back)
      if (back) run(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: t.main, pseudoElement: '::backdrop' }, back)
    }
    if (kind === 'type' && !back) {
      run(ghost, [{ strokeDashoffset: GHOST_DASH, strokeOpacity: 0.7 }, { strokeDashoffset: 0, strokeOpacity: 0.16 }], { duration: t.main, delay: 0.1, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, back)
    }
    if (back) {
      // El contenido y la cruz se apagan primero.
      for (const el of [content, closer]) run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.2 }, true)
      return
    }
    // La cruz entra con el fundido del contenido (o con el del modal, si el contenido no llega tarde).
    if (stagger || t.content > 0) {
      run(closer, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.35, delay: t.content, easing: 'ease-out' }, false)
    }
    // El contenido: escalonado, o entero con un fundido si llega tarde.
    const parts = content ? [...content.children] : []
    if (stagger) {
      parts.forEach((part, i) =>
        run(part, [{ opacity: 0, translate: `0 ${STAGGER.rise}px` }, { opacity: 1, translate: '0 0' }], { duration: STAGGER.duration, delay: t.content + i * STAGGER.step, easing: 'ease-out' }, false),
      )
    } else if (t.content > 0 && kind !== 'frost') {
      run(content, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.35, delay: t.content, easing: 'ease-out' }, false)
    }
  }

  function stop() {
    for (const animation of running) animation.cancel()
    running = []
  }

  async function open(person: Person) {
    stop()
    from = founderDialog.from
    kind = chosen === 'card' && !from ? 'fade' : chosen
    beamStart = { delay: OPEN_TIMING[kind].beamDelay / speed, duration: OPEN_TIMING[kind].beam / speed }
    shown = person
    opened += 1
    await tick()
    if (!dialog) return
    dialog.showModal()
    active = true
    if (!reduced()) animate(false)
  }

  async function close() {
    if (!dialog) return
    closing = true
    stop()
    if (!reduced()) {
      animate(true)
      await Promise.all(running.map((a) => a.finished.catch(() => {})))
    }
    stop()
    closedHere = true
    dialog.close()
    active = false
    closing = false
    // Si se pidió abrir otra vez mientras se cerraba, se abre ahora.
    const again = untrack(() => wanted)
    if (again) open(again)
  }

  // Abre y cierra el <dialog> con el estado (la card de la escena o el link).
  $effect(() => {
    const person = wanted
    untrack(() => {
      if (!dialog || closing) return
      if (person && !dialog.open) open(person)
      else if (!person && dialog.open) close()
    })
  })

  /** Cuándo se enciende el haz y cuánto tarda, en segundos (de la apertura en curso). */
  let beamStart = { delay: 0, duration: 1.4 }

  // El haz corre solo mientras el modal está abierto.
  $effect(() => {
    if (!active || !canvas) return
    const beam: LightBeam | null = lightBeam(canvas, PALETTE.ink)
    if (!beam) return
    const still = reduced()
    const { delay, duration } = beamStart
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      // Se enciende desde el centro; con movimiento reducido, quieto y entero.
      const open = still ? 1 : 1 - Math.pow(1 - Math.min(1, Math.max(0, t - delay) / duration), 3)
      beam.draw(still ? 0 : t * speed, open)
      if (!still) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      beam.destroy()
    }
  })
</script>

<!-- Las teclas no salen del modal: el deck no se mueve detrás. Escape lo cierra (con la animación de cierre). -->
<dialog
  bind:this={dialog}
  class="founder-dialog"
  data-open={kind}
  aria-labelledby="founder-dialog-name"
  onclose={() => {
    // Lo cerró el navegador, sin la animación (dos Escape seguidos, por ejemplo): el estado lo sigue.
    if (closedHere) closedHere = false
    else {
      active = false
      closeFounder()
    }
  }}
  oncancel={(e) => {
    e.preventDefault()
    closeFounder()
  }}
  onkeydown={(e) => e.stopPropagation()}
  onwheel={(e) => e.stopPropagation()}
>
  {#if shown}
    {#key opened}<canvas bind:this={canvas} class="beam" aria-hidden="true"></canvas>{/key}
    {#if shown.photo}<img bind:this={photo} class="photo" src={shown.photo} alt="" aria-hidden="true" />{/if}
    <svg class="ghost" style:top="{Math.round(BEAM_TOP * 1000) / 10}%" aria-hidden="true">
      <text bind:this={ghost} x="50%" y="0" text-anchor="middle" dominant-baseline="central" stroke-dasharray={GHOST_DASH}>{shown.name}</text>
    </svg>
    <!-- La cruz, arriba a la derecha (pedido del usuario, 2026-11-27; DESIGN.md §6). -->
    <button bind:this={closer} class="close" type="button" aria-label={ABOUT.card.close} onclick={closeFounder}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
    <div class="content" bind:this={content}>
      <p class="eyebrow">{shown.label}</p>
      <h2 id="founder-dialog-name">{shown.name}</h2>
      <p class="role">{shown.role}</p>
      <p class="bio"><LeadIn text={shown.bio} /></p>
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

  .founder-dialog::backdrop {
    background: var(--color-ink);
  }

  /* Estas aperturas dejan ver la página alrededor del recorte o a través del esmerilado. */
  .founder-dialog[data-open='card']::backdrop,
  .founder-dialog[data-open='slit']::backdrop,
  .founder-dialog[data-open='frost']::backdrop {
    background: transparent;
  }

  /* La foto de la card, solo mientras el modal crece desde ella (como en la card: al 70 %). */
  .photo {
    position: absolute;
    object-fit: cover;
    filter: brightness(0.7);
    opacity: 0;
    pointer-events: none;
  }

  .beam {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* El nombre gigante en contorno, detrás del haz y a su altura (como la marca de la referencia). */
  .ghost {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1px;
    overflow: visible;
    font-size: clamp(4rem, 15vw, 15rem);
    font-weight: 400;
    letter-spacing: -0.03em;
    pointer-events: none;
    user-select: none;
  }

  .ghost text {
    fill: none;
    stroke: var(--color-white);
    stroke-opacity: 0.16;
    stroke-width: 1px;
  }

  .close {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-white) 8%, transparent);
    color: var(--color-white);
    cursor: pointer;
    transition: background-color 0.2s ease-out;
  }

  .close:hover {
    background: color-mix(in srgb, var(--color-white) 16%, transparent);
  }

  .close:focus-visible {
    outline: 2px solid var(--color-white);
    outline-offset: 3px;
  }

  .close svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
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
