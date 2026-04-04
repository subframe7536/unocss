import { defineConfig } from 'tsdown'

/**
 * Rolldown plugin that patches `@unocss/vite` at build time to strip out all
 * inspector-related code.  Uses a `transform` hook rather than a module stub
 * so that the inspector import and the runtime conditional are both removed from
 * the bundled output.
 */
const patchInspectorPlugin = {
  name: 'patch-unocss-inspector',
  transform(code: string, id: string) {
    if (!id.includes('@unocss/vite'))
      return null
    return {
      code: code
        // Remove the inspector default import
        .replace(/import UnocssInspector from ['"]@unocss\/inspector['"];?[\r\n]*/g, '')
        // Remove the runtime push: if (inlineConfig.inspector !== false) plugins.push(UnocssInspector(ctx));
        .replace(/if\s*\(inlineConfig\.inspector\s*!==\s*false\)\s*plugins\.push\(UnocssInspector\(ctx\)\);?[\r\n]*/g, ''),
    }
  },
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
    plugins: [patchInspectorPlugin],
  },
  // Oxlint plugin entry: ESM-only, @oxlint/plugins is bundled (not external)
  {
    entry: {
      'oxlint-plugin': 'src/oxlint-plugin/index.ts',
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
      worker: 'src/oxlint-plugin/worker.ts',
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


