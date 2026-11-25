<script lang="ts">
  import type { Page } from '$lib/content.js'
  import type { WarpLook } from '$lib/scene/edge-warp.js'
  import { CONTROL_GROUPS, changedKeys, decimals, formatLook, type LookName } from './warp-lab.js'
  import { DEFAULT_LOOKS, lab as maybeLab } from './warp-lab.svelte.js'

  /**
   * Banco de pruebas de los efectos de los bordes (solo en desarrollo): cada
   * valor de los looks de `edge-warp.ts`, en vivo sobre la escena. Es una
   * herramienta de trabajo, no parte del sitio: no se publica en el build.
   */
  interface Props {
    /** La página que se ve: arranca editando su look. */
    page: Page
  }

  let { page }: Props = $props()

  // El panel solo se monta en desarrollo, donde el estado existe.
  const lab = maybeLab!

  let picked = $state<LookName | null>(null)
  const name = $derived<LookName>(picked ?? (page === 'showcase' ? 'showcase' : 'home'))
  const look = $derived(lab.looks[name])
  const changed = $derived(new Set(changedKeys(DEFAULT_LOOKS[name], look)))
  const code = $derived(formatLook(name, look))

  let copied = $state(false)

  $effect(() => {
    // Lee todo lo que se guarda: cualquier cambio lo persiste.
    JSON.stringify(lab.looks)
    void lab.colorCases
    void lab.open
    lab.save()
  })

  function set(key: keyof WarpLook, value: number) {
    if (Number.isFinite(value)) lab.looks[name][key] = value
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    copied = true
    setTimeout(() => (copied = false), 1500)
  }
</script>

<aside class="lab" class:closed={!lab.open} aria-label="Banco de pruebas de los bordes">
  <header>
    <button class="toggle" onclick={() => (lab.open = !lab.open)} aria-expanded={lab.open}>
      {lab.open ? 'Cerrar' : 'Banco de pruebas'}
    </button>
    {#if lab.open}
      <strong>Bordes</strong>
      <span class="count">{changed.size} cambios</span>
    {/if}
  </header>

  {#if lab.open}
    <div class="body">
      <div class="tabs" role="tablist">
        {#each ['showcase', 'home'] as const as option (option)}
          <button role="tab" aria-selected={name === option} onclick={() => (picked = option)}>
            {option === 'showcase' ? 'Showcase' : 'Home'}
          </button>
        {/each}
      </div>
      {#if name !== (page === 'showcase' ? 'showcase' : 'home')}
        <p class="note">Estás editando el look de otra página: vas a ver el cambio cuando la abras.</p>
      {/if}

      <label class="check">
        <input type="checkbox" bind:checked={lab.colorCases} />
        Casos de colores (para ver el reflejo)
      </label>

      {#each CONTROL_GROUPS as group (group.title)}
        <fieldset>
          <legend>{group.title}</legend>
          {#each group.controls as control (control.key)}
            <div class="control" class:changed={changed.has(control.key)}>
              <div class="row">
                <label for="lab-{control.key}">{control.label}</label>
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
                  title="Valor de fábrica: {DEFAULT_LOOKS[name][control.key]}"
                  disabled={!changed.has(control.key)}
                  onclick={() => set(control.key, DEFAULT_LOOKS[name][control.key])}>↺</button
                >
              </div>
              <input
                id="lab-{control.key}"
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={look[control.key]}
                oninput={(e) => set(control.key, e.currentTarget.valueAsNumber)}
              />
              {#if control.hint}<small>{control.hint}</small>{/if}
            </div>
          {/each}
        </fieldset>
      {/each}

      <div class="actions">
        <button class="primary" onclick={copy}>{copied ? 'Copiado' : 'Copiar valores'}</button>
        <button onclick={() => lab.reset(name)} disabled={changed.size === 0}>Restablecer</button>
      </div>
      <details>
        <summary>Código para <code>edge-warp.ts</code></summary>
        <pre>{code}</pre>
      </details>
    </div>
  {/if}
</aside>

<style>
  .lab {
    position: fixed;
    top: 12px;
    right: 12px;
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

  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .tabs [aria-selected='true'],
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

  fieldset {
    margin: 0;
    padding: 8px;
    border: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
    border-radius: 8px;
    display: grid;
    gap: 8px;
  }

  legend {
    font-weight: 700;
    padding: 0 4px;
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
