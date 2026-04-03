import { defineConfig } from 'tsdown'

export default defineConfig([
  // Main entry: core + presets + transformers
  {
    entry: {
      index: 'src/index.ts',
    },
    format: 'esm',
    dts: true,
    external: [
      '@unocss/core',
      '@unocss/preset-wind3',
      '@unocss/preset-icons',
      '@unocss/preset-web-fonts',
      '@unocss/transformer-directives',
      '@unocss/transformer-variant-group',
    ],
  },
  // Vite plugin entry (no inspector)
  {
    entry: {
      vite: 'src/vite.ts',
    },
    format: 'esm',
    dts: true,
    external: [
      '@unocss/vite',
      '@unocss/core',
      'vite',
    ],
  },
  // ESLint plugin entry (no @typescript-eslint/utils)
  {
    entry: {
      'eslint-plugin': 'src/eslint-plugin/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    external: [
      'eslint',
      '@unocss/config',
      '@unocss/core',
      'synckit',
      'magic-string',
    ],
  },
  // Worker entry (always ESM, separate bundle)
  {
    entry: {
      worker: 'src/eslint-plugin/worker.ts',
    },
    format: 'esm',
    dts: false,
    external: [
      '@unocss/config',
      '@unocss/core',
      'synckit',
    ],
  },
])
