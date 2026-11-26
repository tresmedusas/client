<script lang="ts">
  import { PRISM_LOOK, type PrismLook } from '$lib/scene/prism-look.js'
  import { CONTROL_GROUPS, GLASS_PILL_TRY, changedKeys, decimals, formatLook } from './prism-lab.js'
  import { prismLab } from './prism-lab.svelte.js'

  /**
   * Banco de pruebas del botón del hero (solo en desarrollo): los haces, el
   * aro, el click y la píldora de `prism-look.ts`, en vivo sobre el botón
   * (en el hero y en la navbar del showcase). Es una herramienta de trabajo,
   * no parte del sitio: no se publica en el build.
   */

  // El panel solo se monta en desarrollo, donde el estado existe.
  const lab = prismLab!

  const look = $derived(lab.look)
  const changed = $derived(new Set(changedKeys(PRISM_LOOK, look)))
  const code = $derived(formatLook(look))

  let copied = $state(false)
  /** Grupos abiertos: arrancan los del vidrio y los haces en la píldora. */
  let openGroups = $state<Record<string, boolean>>({ 'Vidrio de la píldora': true, 'Haces en la píldora': true })

  $effect(() => {
    // Lee todo lo que se guarda: cualquier cambio lo persiste.
    JSON.stringify(lab.look)
    void lab.open
    void lab.navigate
    void lab.hover
    lab.save()
  })

  function set(key: keyof PrismLook, value: number) {
    if (Number.isFinite(value)) lab.look[key] = value
  }

  /** El rango de color de un haz, como degradado: de un extremo al otro del rango. */
  function hueStrip(key: keyof PrismLook): string {
    const n = key.slice(-1)
    const hue = look[`hue${n}` as keyof PrismLook]
    const range = look[`hueRange${n}` as keyof PrismLook]
    const stops = Array.from({ length: 7 }, (_, i) => `hsl(${hue + (i / 6 - 0.5) * range} 100% 55%)`)
    return `linear-gradient(90deg, ${stops.join(', ')})`
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    copied = true
    setTimeout(() => (copied = false), 1500)
  }
</script>

<aside class="lab" class:closed={!lab.open} aria-label="Banco de pruebas del botón">
  <header>
    <button class="toggle" onclick={() => (lab.open = !lab.open)} aria-expanded={lab.open}>
      {lab.open ? 'Cerrar' : 'Botón'}
    </button>
    {#if lab.open}
      <strong>Botón del hero</strong>
      <span class="count">{changed.size} cambios</span>
    {/if}
  </header>

  {#if lab.open}
    <div class="body">
      <p class="note">Se ve en el botón del hero y en la navbar del showcase.</p>
      <label class="check">
        <input type="checkbox" bind:checked={lab.hover} />
        Verlo como con el puntero encima
      </label>
      <label class="check">
        <input type="checkbox" bind:checked={lab.navigate} />
        El click navega (si no, solo destella)
      </label>
      <button onclick={() => Object.assign(lab.look, GLASS_PILL_TRY)} title="Cambia solo el vidrio, el label y los haces en la píldora">
        Probar: píldora de vidrio con los haces adentro
      </button>

      {#each CONTROL_GROUPS as group (group.title)}
        {@const count = group.controls.filter((c) => changed.has(c.key)).length}
        <details class="group" bind:open={openGroups[group.title]}>
          <summary>{group.title}{#if count > 0}<span class="badge">{count}</span>{/if}</summary>
          <div class="controls">
            {#each group.controls as control (control.key)}
              <div class="control" class:changed={changed.has(control.key)}>
                <div class="row">
                  <label for="prism-{control.key}">{control.label}</label>
                  <input
                    class="number"
                    type="number"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={Number(look[control.key].toFixed(decimals(control.step)))}
                    oninput={(e) => set(control.key, e.currentTarget.valueAsNumber)}
                  />
                  <button
                    class="undo"
                    title="Valor de fábrica: {PRISM_LOOK[control.key]}"
                    disabled={!changed.has(control.key)}
                    onclick={() => set(control.key, PRISM_LOOK[control.key])}>↺</button
                  >
                </div>
                <input
                  id="prism-{control.key}"
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={look[control.key]}
                  oninput={(e) => set(control.key, e.currentTarget.valueAsNumber)}
                />
                {#if control.hue}<span class="strip" style:background={hueStrip(control.key)}></span>{/if}
                {#if control.hint}<small>{control.hint}</small>{/if}
              </div>
            {/each}
          </div>
        </details>
      {/each}

      <div class="actions">
        <button class="primary" onclick={copy}>{copied ? 'Copiado' : 'Copiar valores'}</button>
        <button onclick={() => lab.reset()} disabled={changed.size === 0}>Restablecer</button>
      </div>
      <details>
        <summary>Código para <code>prism-look.ts</code></summary>
        <pre>{code}</pre>
      </details>
    </div>
  {/if}
</aside>

<style>
  /* A la izquierda: a la derecha va el banco de los bordes. */
  .lab {
    position: fixed;
    top: 12px;
    left: 12px;
    bottom: 12px;
    z-index: 1000;
    width: 320px;
    display: flex;
    flex-direction: column;
    font: 12px/1.35 var(--font-sans);
    color: var(--color-ink);
    background: var(--color-paper);
    border: 1px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
    border-radius: 12px;
    box-shadow: 0 8px 32px color-mix(in srgb, var(--color-ink) 12%, transparent);
    overflow: hidden;
  }

  .lab.closed {
    bottom: auto;
    width: auto;
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  }

  .closed header {
    border-bottom: 0;
  }

  .count {
    margin-left: auto;
    color: var(--color-muted);
  }

  .body {
    overflow-y: auto;
    padding: 10px;
    display: grid;
    gap: 10px;
    align-content: start;
  }

  button {
    font: inherit;
    color: inherit;
    background: var(--color-white);
    border: 1px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .primary {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .note,
  small {
    margin: 0;
    color: var(--color-muted);
  }

  .check {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .group {
    border: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
    border-radius: 8px;
    padding: 6px 8px;
  }

  .group summary {
    font-weight: 700;
    cursor: pointer;
  }

  .badge {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 8px;
    font-size: 11px;
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .controls {
    display: grid;
    gap: 8px;
    padding-top: 8px;
  }

  .control {
    display: grid;
    gap: 2px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .row label {
    flex: 1;
  }

  .changed label {
    font-weight: 700;
  }

  .number {
    width: 64px;
    font: inherit;
    text-align: right;
    padding: 2px 4px;
    border: 1px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
    border-radius: 4px;
  }

  .undo {
    padding: 0 6px;
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--color-ink);
  }

  .strip {
    display: block;
    height: 6px;
    border-radius: 3px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  pre {
    margin: 6px 0 0;
    padding: 8px;
    font-size: 11px;
    background: var(--color-white);
    border-radius: 6px;
    overflow-x: auto;
    user-select: all;
  }
</style>
