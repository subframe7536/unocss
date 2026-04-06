import type { Plugin } from 'vite'
/**
 * Rolldown plugin that patches `@unocss/vite` at build time.
 *
 * Uses an object-style hook with a module id filter
 * so that rolldown can skip the handler entirely for non-matching files.
 */
export const patchVitePlugin: Plugin = {
  name: 'patch-vite-plugin',
  transform: {
    filter: { id: /@unocss\/vite/ },
    handler(code) {
      const targetCode = code
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
        ) // Remove Vue files from the default pipeline include to avoid Vue/Svelte-specific handling
        .replace(
          /const defaultPipelineInclude = \[[\s\S]*?\];/g,
          'const defaultPipelineInclude = [/\\.([jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html)($|\\?)/];',
        )
        // Disable vue-scoped mode registration
        .replace(
          /else if \(mode === "vue-scoped"\) plugins\.push\(VueScopedPlugin\(ctx\)\);/g,
          'else if (mode === "vue-scoped") throw new Error("[@subf/unocss] vue-scoped mode removed");',
        )
        // Disable shadow-dom mode registration
        .replace(
          /else if \(mode === "shadow-dom"\) plugins\.push\(ShadowDomModuleModePlugin\(ctx\)\);/g,
          'else if (mode === "shadow-dom") throw new Error("[@subf/unocss] shadow-dom mode removed");',
        )
        // Remove chokidar dynamic import path and use vite watcher passed from configureServer.
        .replace(
          /async function setupContentExtractor\(ctx, shouldWatch = false\) \{/g,
          'async function setupContentExtractor(ctx, shouldWatch, viteWatcher) {',
        )
        .replace(/\s*file = isAbsolute\(file\) \? file : resolve\(root, file\);\n/g, '\n')
        .replace(
          /if \(shouldWatch\) \{[\s\S]*?\}\n\s*await Promise\.all\(files\.map\(extractFile\)\);/g,
          [
            'if (shouldWatch && viteWatcher) {',
            '  const absoluteFiles = files.map((f) => (isAbsolute(f) ? f : resolve(root, f)));',
            '  const absoluteFilesSet = new Set(absoluteFiles);',
            '  viteWatcher.add(absoluteFiles);',
            '  const onFileEvent = (file) => {',
            '    if (absoluteFilesSet.has(file))',
            '      tasks.push(extractFile(file));',
            '  };',
            '  viteWatcher.on("add", onFileEvent);',
            '  viteWatcher.on("change", onFileEvent);',
            '}',
            'await Promise.all(files.map(extractFile));',
          ].join('\n'),
        )
        .replace(
          /configResolved\(config\) \{\n\s*viteConfig = config;\n\s*\},/g,
          [
            'configResolved(config) {',
            '  viteConfig = config;',
            '},',
            'configureServer(server) {',
            '  viteConfig._viteWatcher = server.watcher;',
            '},',
          ].join('\n'),
        )
        .replace(
          /tasks\.push\(setupContentExtractor\(ctx, viteConfig\.mode !== "test" && viteConfig\.command === "serve"\)\);/g,
          'tasks.push(setupContentExtractor(ctx, viteConfig.mode !== "test" && viteConfig.command === "serve", viteConfig._viteWatcher));',
        )
      return {
        code: targetCode,
      }
    },
  },
}
