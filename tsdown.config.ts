import { defineConfig } from 'tsdown'

/**
 * Tsdown plugin that stubs out `@unocss/inspector` at build time.
 * The inspector code path in @unocss/vite checks `if (inlineConfig.inspector !== false)` before
 * calling `UnocssInspector(ctx)`. Our stub returns null, which is filtered out by the vite
 * plugin's `return plugins.filter(Boolean)` call at the end.
 */
function stubInspectorPlugin() {
  return {
    name: 'stub-unocss-inspector',
    resolveId(id: string) {
      if (id === '@unocss/inspector')
        return '\0@unocss/inspector'
      return null
    },
    load(id: string) {
      if (id === '\0@unocss/inspector')
        return 'export default function UnocssInspector() { return null }'
      return null
    },
  }
}

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
  // Vite plugin entry: @unocss/vite is bundled (not external), inspector is stubbed
  {
    entry: {
      vite: 'src/vite.ts',
    },
    format: 'esm',
    dts: true,
    // Only externalize true peer/runtime dependencies; bundle @unocss/vite and its sub-deps
    external: [
      '@unocss/core',
      '@unocss/config',
      'vite',
    ],
    // Use deterministic chunk names (no hash) so output is stable
    hash: false,
    plugins: [stubInspectorPlugin()],
  },
  // ESLint plugin entry: @oxlint/plugins is bundled (not external)
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

