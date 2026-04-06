import { readdirSync, writeFileSync } from 'node:fs'

import { defineConfig } from 'tsdown'

/**
 * Rolldown plugin that patches `@unocss/vite` at build time to strip out all
 * inspector-related code.  Uses an object-style hook with a module id filter
 * so that rolldown can skip the handler entirely for non-matching files.
 */
const patchInspectorPlugin = {
  name: 'patch-unocss-inspector',
  transform: {
    filter: { id: /@unocss\/vite/ },
    handler(code: string) {
      return {
        code: code
          // Replace the `createFilter` import from Vite's version instead of unplugin-utils
          .replace(
            /import { createFilter } from ['"]unplugin-utils['"];/g,
            'import { createFilter } from "vite";',
          )
          // Remove the inspector default import
          .replace(/import UnocssInspector from ['"]@unocss\/inspector['"];?[\r\n]*/g, '')
          // Remove the runtime push: if (inlineConfig.inspector !== false) plugins.push(UnocssInspector(ctx));
          .replace(
            /if\s*\(inlineConfig\.inspector\s*!==\s*false\)\s*plugins\.push\(UnocssInspector\(ctx\)\);?[\r\n]*/g,
            '',
          ),
      }
    },
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
    plugins: [patchInspectorPlugin],
  },
  // Oxlint plugin entry: ESM-only
  {
    entry: {
      'oxlint-plugin': 'src/oxlint-plugin/index.ts',
    },
    format: 'esm',
    dts: true,
    exports: true,
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
