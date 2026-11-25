<script lang="ts">
  // Panel del banco de pruebas de la navbar (temporal): edita en vivo el lente
  // oscuro y el vidrio de la barra. Vive fuera del canvas, así sus controles no
  // mueven el deck.
  import { barTune, lensTune, resetBarTune, resetLensTune, saveTune } from './lens-tune.svelte.js'

  type Values = Record<string, string | number>
  type Field =
    | { key: string; label: string; kind: 'range'; min: number; max: number; step: number }
    | { key: string; label: string; kind: 'color' }
    | { key: string; label: string; kind: 'select'; options: [value: string, label: string][] }

  const range = (key: string, label: string, min: number, max: number, step: number): Field => ({ key, label, kind: 'range', min, max, step })
  const PROFILE: Field = { key: 'profile', label: 'Perfil', kind: 'select', options: [['squircle', 'squircle'], ['dome', 'dome'], ['circle', 'circle']] }
  const TINT_MODE: Field = { key: 'tintMode', label: 'Modo del tinte', kind: 'select', options: [['overlay', 'overlay'], ['dye', 'dye']] }

  /** Lo común a los dos vidrios. */
  const GLASS: Field[] = [
    { key: 'tint', label: 'Tinte', kind: 'color' },
    TINT_MODE,
    range('tintOpacity', 'Opacidad del tinte', 0, 1, 0.01),
    range('brightness', 'Brillo', -1, 1, 0.01),
    range('saturation', 'Saturación', -1, 1, 0.01),
    range('blur', 'Blur', 0, 20, 0.5),
    range('refraction', 'Refracción', 0, 3, 0.05),
    range('ior', 'IOR', 1, 2.2, 0.01),
    range('magnify', 'Magnify', 0.7, 1.3, 0.01),
    range('dispersion', 'Dispersión', 0, 0.3, 0.005),
    PROFILE,
    range('bevelWidth', 'Ancho del bisel', 0, 30, 1),
    range('bevelDepth', 'Alto del bisel', 0, 40, 1),
    range('lip', 'Lip', 0, 30, 1),
    range('lipSharpness', 'Filo del lip', 1, 20, 0.5),
    range('thickness', 'Espesor', 0, 60, 1),
    range('reflection', 'Reflejo', 0, 1, 0.01),
    range('specular', 'Especular', 0, 1.5, 0.01),
    range('rim', 'Canto', 0, 1.5, 0.01),
    range('shadowOpacity', 'Sombra', 0, 0.3, 0.005),
    range('tilt', 'Tilt', 0, 1, 0.01),
  ]

  const TABS = {
    lente: {
      title: 'Lente oscuro',
      values: lensTune as unknown as Values,
      reset: resetLensTune,
      fields: [
        range('inset', 'Aire al borde (px)', 0, 14, 1),
        range('stretch', 'Deformación', 0, 1, 0.05),
        { key: 'label', label: 'Ícono y texto', kind: 'select', options: [['paper', 'blanco'], ['ink', 'tinta']] } as Field,
        ...GLASS,
      ],
    },
    barra: {
      title: 'Barra y burbuja',
      values: barTune as unknown as Values,
      reset: resetBarTune,
      fields: [
        ...GLASS,
        range('edgeSharpness', 'Filo del blur', 0, 1, 0.01),
        range('softness', 'Suavidad del borde', 0, 4, 0.1),
        range('shadowSpread', 'Alcance de la sombra', 0, 40, 1),
        range('shadowOffsetY', 'Corrimiento de la sombra', 0, 12, 0.5),
        range('surfaceRoughness', 'Rugosidad', 0, 1, 0.01),
      ],
    },
  }

  let tab = $state<keyof typeof TABS>('lente')
  let open = $state(true)
  let copied = $state(false)
  const current = $derived(TABS[tab])

  function set(key: string, value: string | number) {
    current.values[key] = value
    saveTune()
  }

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify({ lente: lensTune, barra: barTune }, null, 2))
    copied = true
    setTimeout(() => (copied = false), 1500)
  }
</script>

<aside class="tuner" aria-label="Banco de pruebas de la navbar">
  <header>
    <div class="tabs" role="tablist">
      {#each Object.entries(TABS) as [id, t] (id)}
        <button type="button" role="tab" aria-selected={tab === id} onclick={() => (tab = id as keyof typeof TABS)}>{t.title}</button>
      {/each}
    </div>
    <button type="button" onclick={() => (open = !open)}>{open ? 'Ocultar' : 'Mostrar'}</button>
  </header>
  {#if open}
    <div class="rows">
      {#each current.fields as f (f.key)}
        <label class="row">
          <span>{f.label}</span>
          {#if f.kind === 'range'}
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={current.values[f.key]}
              oninput={(e) => set(f.key, Number(e.currentTarget.value))}
            />
            <output>{current.values[f.key]}</output>
          {:else if f.kind === 'color'}
            <input class="wide" type="color" value={current.values[f.key]} oninput={(e) => set(f.key, e.currentTarget.value)} />
          {:else}
            <select class="wide" value={current.values[f.key]} onchange={(e) => set(f.key, e.currentTarget.value)}>
              {#each f.options as [value, label] (value)}
                <option {value}>{label}</option>
              {/each}
            </select>
          {/if}
        </label>
      {/each}
    </div>
    <footer>
      <button type="button" onclick={copy}>{copied ? 'Copiado' : 'Copiar valores'}</button>
      <button type="button" onclick={current.reset}>Restablecer {tab}</button>
    </footer>
  {/if}
</aside>

<style>
  .tuner {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 10;
    width: 320px;
    max-height: calc(100vh - 120px);
    overflow: hidden auto;
    box-sizing: border-box;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--color-paper);
    color: var(--color-ink);
    box-shadow: 0 4px 24px rgb(0 0 0 / 0.12);
    font: 12px/1.4 var(--font-sans);
  }

  header,
  footer {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  footer {
    margin-top: 10px;
  }

  .tabs {
    display: flex;
    gap: 4px;
  }

  .tabs button[aria-selected='true'] {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .rows {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }

  .row {
    display: grid;
    grid-template-columns: 120px 1fr 40px;
    gap: 8px;
    align-items: center;
  }

  .row > * {
    min-width: 0;
  }

  .row input,
  .row select {
    width: 100%;
    box-sizing: border-box;
    margin: 0;
  }

  .wide {
    grid-column: 2 / 4;
  }

  output {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  button {
    padding: 4px 10px;
    border: 1px solid currentcolor;
    border-radius: 999px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
</style>
