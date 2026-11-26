<script lang="ts">
  import type { Page } from '$lib/content.js'
  import { CASE_LOOK } from '$lib/scene/layout.js'
  import { CASE_CONTROLS, CONTROL_GROUPS, WARP_CONST, changedKeys, decimals, formatConst, type ControlGroup, type LookName } from './warp-lab.js'
  import { DEFAULT_LOOKS, lab as maybeLab } from './warp-lab.svelte.js'
  import { TRANSITION_KINDS } from '$lib/scene/case-transition.js'

  /**
   * Banco de pruebas (solo en desarrollo): cada valor de los bordes
   * (`edge-warp.ts`) y del tamaño de las cards del showcase (`layout.ts`), en
   * vivo sobre la escena. Es una herramienta de trabajo, no parte del sitio:
   * no se publica en el build.
   */
  interface Props {
    /** La página que se ve: arranca editando su look. */
    page: Page
  }

  let { page }: Props = $props()

  // El panel solo se monta en desarrollo, donde el estado existe.
  const lab = maybeLab!

  type Values = Record<string, number>

  let picked = $state<LookName | null>(null)
  const name = $derived<LookName>(picked ?? (page === 'showcase' ? 'showcase' : 'home'))

  // Bordes del look elegido.
  const look = $derived(lab.looks[name] as unknown as Values)
  const lookDefaults = $derived(DEFAULT_LOOKS[name] as unknown as Values)
  const lookChanged = $derived(new Set<string>(changedKeys(lookDefaults, look, CONTROL_GROUPS)))
  const lookCode = $derived(formatConst(WARP_CONST[name], 'WarpLook', look, CONTROL_GROUPS))

  // Cards del showcase.
  const cases = $derived(lab.cases as unknown as Values)
  const caseDefaults = CASE_LOOK as unknown as Values
  const casesChanged = $derived(new Set<string>(changedKeys(caseDefaults, cases, CASE_CONTROLS)))
  const casesCode = $derived(formatConst('CASE_LOOK', 'CaseLook', cases, CASE_CONTROLS))

  const total = $derived(lookChanged.size + (name === 'showcase' ? casesChanged.size : 0))

  let copied = $state<string | null>(null)

  $effect(() => {
    // Lee todo lo que se guarda: cualquier cambio lo persiste.
    JSON.stringify(lab.looks)
    JSON.stringify(lab.cases)
    void lab.colorCases
    void lab.transition
    void lab.slowTransition
    void lab.open
    lab.save()
  })

  async function copy(what: string, code: string) {
    await navigator.clipboard.writeText(code)
    copied = what
    setTimeout(() => (copied = null), 1500)
  }
</script>

{#snippet controls(groups: readonly ControlGroup[], values: Values, defaults: Values, changed: Set<string>, prefix: string)}
  {#each groups as group (group.title)}
    <fieldset>
      <legend>{group.title}</legend>
      {#each group.controls as control (control.key)}
        {@const set = (value: number) => {
          if (Number.isFinite(value)) values[control.key] = value
        }}
        <div class="control" class:changed={changed.has(control.key)}>
          <div class="row">
            <label for="lab-{prefix}-{control.key}">{control.label}</label>
            <input
              class="number"
              type="number"
              min={control.min}
              max={control.max}
              step={control.step}
              value={Number(values[control.key]!.toFixed(decimals(control.step)))}
              oninput={(e) => set(e.currentTarget.valueAsNumber)}
            />
            <button
              class="undo"
              title="Valor de fábrica: {defaults[control.key]}"
              disabled={!changed.has(control.key)}
              onclick={() => set(defaults[control.key]!)}>↺</button
            >
          </div>
          <input
            id="lab-{prefix}-{control.key}"
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={values[control.key]}
            oninput={(e) => set(e.currentTarget.valueAsNumber)}
          />
          {#if control.hint}<small>{control.hint}</small>{/if}
        </div>
      {/each}
    </fieldset>
  {/each}
{/snippet}

<aside class="lab" class:closed={!lab.open} aria-label="Banco de pruebas">
  <header>
    <button class="toggle" onclick={() => (lab.open = !lab.open)} aria-expanded={lab.open}>
      {lab.open ? 'Cerrar' : 'Banco de pruebas'}
    </button>
    {#if lab.open}
      <strong>Banco de pruebas</strong>
      <span class="count">{total} cambios</span>
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
        <p class="note">Estás editando otra página: vas a ver el cambio cuando la abras.</p>
      {/if}

      <fieldset>
        <legend>Transición al abrir un caso</legend>
        {#each TRANSITION_KINDS as option (option.kind)}
          <label class="check">
            <input type="radio" name="lab-transition" value={option.kind} bind:group={lab.transition} />
            {option.label}
          </label>
        {/each}
        <label class="check">
          <input type="checkbox" bind:checked={lab.slowTransition} />
          En cámara lenta (×0.2)
        </label>
        <small>Se ve al hacer click en una card del showcase.</small>
      </fieldset>

      {#if name === 'showcase'}
        {@render controls(CASE_CONTROLS, cases, caseDefaults, casesChanged, 'cases')}
        <div class="actions">
          <button class="primary" onclick={() => copy('cases', casesCode)}>{copied === 'cases' ? 'Copiado' : 'Copiar cards'}</button>
          <button onclick={() => lab.resetCases()} disabled={casesChanged.size === 0}>Restablecer cards</button>
        </div>
        <details>
          <summary>Código para <code>layout.ts</code></summary>
          <pre>{casesCode}</pre>
        </details>
      {/if}

      <label class="check">
        <input type="checkbox" bind:checked={lab.colorCases} />
        Casos de colores (para ver el reflejo)
      </label>

      {@render controls(CONTROL_GROUPS, look, lookDefaults, lookChanged, 'warp')}

      <div class="actions">
        <button class="primary" onclick={() => copy('warp', lookCode)}>{copied === 'warp' ? 'Copiado' : 'Copiar bordes'}</button>
        <button onclick={() => lab.reset(name)} disabled={lookChanged.size === 0}>Restablecer bordes</button>
      </div>
      <details>
        <summary>Código para <code>edge-warp.ts</code></summary>
        <pre>{lookCode}</pre>
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
