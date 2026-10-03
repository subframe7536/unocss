import type { Plugin } from 'vite'

/**
 * Patch the published @unocss/vite@66.10.5 entry while bundling it.
 * Required replacements fail loudly when upstream code changes.
 */
export const patchVitePlugin: Plugin = {
  name: 'patch-vite-plugin',
  transform: {
    filter: { id: /[/\\]@unocss[/\\]vite[/\\]dist[/\\]index\.mjs$/ },
    handler(code) {
      function replace(name: string, pattern: RegExp, replacement: string) {
        const matches = code.match(pattern)?.length ?? 0
        if (matches !== 1) {
          throw new Error(
            `[patch-vite-plugin] ${name}: expected 1 matches, found ${matches}. Regenerate the patch for the installed @unocss/vite version.`,
          )
        }
        code = code.replace(pattern, replacement)
      }

      replace(
        'Vite createFilter',
        /import \{ createFilter \} from "unplugin-utils";/g,
        'import { createFilter } from "vite";',
      )
      replace('inspector import', /import UnocssInspector from "@unocss\/inspector";\n/g, '')
      replace(
        'inspector registration',
        /\tif \(inlineConfig\.inspector !== false\) plugins\.push\(\.\.\.UnocssInspector\(ctx\)\);\n/g,
        '',
      )
      replace(
        'default pipeline extensions',
        /(const defaultPipelineInclude = \[\/\\\.\()vue\|svelte\|/g,
        '$1',
      )
      replace(
        'vue-scoped mode',
        /else if \(mode === "vue-scoped"\) plugins\.push\(VueScopedPlugin\(ctx\)\);/g,
        'else if (mode === "vue-scoped") throw new Error("[@subf/unocss] vue-scoped mode removed");',
      )
      replace(
        'shadow-dom mode',
        /else if \(mode === "shadow-dom"\) plugins\.push\(ShadowDomModuleModePlugin\(ctx\)\);/g,
        'else if (mode === "shadow-dom") throw new Error("[@subf/unocss] shadow-dom mode removed");',
      )

      // Preserve initial path resolution and upstream's batched filesystem extraction.
      replace(
        'content extractor signature',
        /async function setupContentExtractor\(ctx, shouldWatch = false\) \{/g,
        'async function setupContentExtractor(ctx, shouldWatch, viteWatcher) {',
      )
      replace(
        'filesystem watcher',
        /\t\tif \(shouldWatch\) \{[\s\S]*?\n\t\t\}/g,
        [
          '\t\tif (shouldWatch && viteWatcher) {',
          '\t\t\tconst absoluteFiles = files.map((file) => isAbsolute(file) ? file : resolve(root, file));',
          '\t\t\tconst watchedFiles = new Set(absoluteFiles);',
          '\t\t\tviteWatcher.add(absoluteFiles);',
          '\t\t\tconst onFileEvent = (file) => {',
          '\t\t\t\tif (watchedFiles.has(file)) tasks.push(extractFile(file));',
          '\t\t\t};',
          '\t\t\tviteWatcher.on("add", onFileEvent);',
          '\t\t\tviteWatcher.on("change", onFileEvent);',
          '\t\t}',
        ].join('\n'),
      )
      replace('watcher state', /\tlet viteConfig;\n/g, '\tlet viteConfig;\n\tlet viteWatcher;\n')
      replace(
        'content server hook',
        /\t\t\tconfigResolved\(config\) \{\n\t\t\t\tviteConfig = config;\n\t\t\t\},/g,
        [
          '\t\t\tconfigResolved(config) {',
          '\t\t\t\tviteConfig = config;',
          '\t\t\t},',
          '\t\t\tconfigureServer(server) {',
          '\t\t\t\tviteWatcher = server.watcher;',
          '\t\t\t},',
        ].join('\n'),
      )
      replace(
        'content extractor call',
        /setupContentExtractor\(ctx, viteConfig\.mode !== "test" && viteConfig\.command === "serve"\)/g,
        'setupContentExtractor(ctx, viteConfig.mode !== "test" && viteConfig.command === "serve", viteWatcher)',
      )

      // Temporary upstream fixes; remove once UnoCSS composes maps against the original input.
      replace(
        'source-map composition order',
        /map: remapping\(maps,/g,
        'map: remapping(maps.reverse(),',
      )
      replace('original source-map content', /ctx\.content = code;/g, 'ctx.content = original;')
      replace(
        'native ignore filter',
        /transform\(code, id\) \{\s*return applyTransformers\(ctx, code, id, order\);\s*\},/g,
        [
          'transform: {',
          '\t\t\t\tfilter: { code: { exclude: "@unocss-ignore" } },',
          '\t\t\t\thandler(code, id) {',
          '\t\t\t\t\treturn applyTransformers(ctx, code, id, order);',
          '\t\t\t\t},',
          '\t\t\t},',
        ].join('\n'),
      )

      return { code }
    },
  },
}
