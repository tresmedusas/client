import { sveltekit } from '@sveltejs/kit/vite'
import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    sveltekit(),
    // Shaders propios de la escena (`src/lib/scene/*.glsl`). Los de Essentia
    // ya vienen publicados como módulos JS.
    glsl({ include: ['**/*.glsl'], minify: false }),
  ],
  resolve: {
    // Una sola copia de cada peer de Essentia.
    dedupe: ['svelte', 'three', '@threlte/core', '@threlte/extras'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
