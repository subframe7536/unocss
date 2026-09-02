import { readdirSync, writeFileSync } from 'node:fs'

import { defineConfig } from 'tsdown'

import { patchVitePlugin } from './src/rolldown-plugin-vite-patch.ts'

export default defineConfig([
  // Main entry: core + presets + transformers
  {
    entry: {
      index: 'src/index.ts',
    },
    format: 'esm',
    dts: true,
    exports: {
      customExports(exports) {
        const dir = './node_modules/@unocss/reset'
        readdirSync(dir).forEach((file) => {
          if (file.endsWith('.css')) {
            const dst = `./dist/reset-${file}`
            const content = `@import "@unocss/reset/${file}";\n`
            writeFileSync(dst, content)
            exports[`./reset-${file}`] = dst
          }
        })
        return exports
      },
    },
  },
  // Vite plugin entry: @unocss/vite is bundled (not external), inspector is stripped.
  // All of @unocss/vite's sub-deps are in our `dependencies` and thus auto-external.
  {
    entry: {
      vite: 'src/vite.ts',
    },
    format: 'esm',
    dts: true,
    exports: true,
    deps: {
      onlyBundle: false,
    },
    plugins: [patchVitePlugin],
  },
  // Oxlint plugin entry: ESM-only
  {
    entry: {
      'oxlint-plugin': 'src/oxlint-plugin/index.ts',
    },
    format: 'esm',
    dts: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    exports: true,
    deps: {
      neverBundle: ['@oxlint/plugins'],
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
  },
])
