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
    exports: true,
    deps: {
      neverBundle: [
        '@unocss/core',
        '@unocss/preset-wind3',
        '@unocss/preset-icons',
        '@unocss/preset-web-fonts',
        '@unocss/transformer-directives',
        '@unocss/transformer-variant-group',
      ],
    },
  },
  // Vite plugin entry: @unocss/vite is bundled (not external), inspector is stubbed
  {
    entry: {
      vite: 'src/vite.ts',
    },
    format: 'esm',
    dts: true,
    exports: true,
    // Only externalize true peer/runtime dependencies; bundle @unocss/vite and its sub-deps
    deps: {
      neverBundle: [
        '@unocss/core',
        '@unocss/config',
        'vite',
      ],
    },
    // Use deterministic chunk names (no hash) so output is stable
    hash: false,
    plugins: [stubInspectorPlugin()],
  },
  // Oxlint plugin entry: ESM-only, @oxlint/plugins is bundled (not external)
  {
    entry: {
      'oxlint-plugin': 'src/eslint-plugin/index.ts',
    },
    format: 'esm',
    dts: true,
    exports: true,
    deps: {
      neverBundle: [
        'eslint',
        '@unocss/config',
        '@unocss/core',
        'synckit',
        'magic-string',
      ],
    },
  },
  // Worker entry (always ESM, separate bundle, internal use)
  {
    entry: {
      worker: 'src/eslint-plugin/worker.ts',
    },
    format: 'esm',
    dts: false,
    exports: true,
    deps: {
      neverBundle: [
        '@unocss/config',
        '@unocss/core',
        'synckit',
      ],
    },
  },
])


