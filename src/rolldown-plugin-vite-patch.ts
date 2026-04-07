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
        // Remove the @jridgewell/remapping import (no longer needed after applyTransformers optimization)
        .replace(/import remapping from ['"]@jridgewell\/remapping['"];[\r\n]*/g, '')
        // Remove the runtime push: if (inlineConfig.inspector !== false) plugins.push(UnocssInspector(ctx));
        .replace(
          /if\s*\(inlineConfig\.inspector\s*!==\s*false\)\s*plugins\.push\(UnocssInspector\(ctx\)\);?[\r\n]*/g,
          '',
        )
        // Remove Vue files from the default pipeline include to avoid Vue/Svelte-specific handling
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
        // Remove @unocss-skip range support: remove SKIP_START_COMMENT, SKIP_END_COMMENT, SKIP_COMMENT_RE constants
        .replace(
          /const SKIP_START_COMMENT = "@unocss-skip-start";\nconst SKIP_END_COMMENT = "@unocss-skip-end";\nconst SKIP_COMMENT_RE = new RegExp\(`[^`]*`, "g"\);\n/g,
          '',
        )
        // Remove SKIP_COMMENT_RE usages in extractor calls: code.replace(SKIP_COMMENT_RE, "") → code
        .replace(/code\.replace\(SKIP_COMMENT_RE, ""\)/g, 'code')
        // Remove transformSkipCode and restoreSkipCode helper function definitions
        // Use whitespace-agnostic patterns (avoid literal \t) for future-safety
        .replace(
          /function transformSkipCode\([^)]*\) \{[\s\S]*?return code;\n\}\nfunction restoreSkipCode\([^)]*\) \{[\s\S]*?return code;\n\}\n/,
          '',
        )
        // Replace the entire applyTransformers function:
        //   - Remove skipMap / transformSkipCode / restoreSkipCode / remapping usage
        //   - Keep per-transformer source map generation; return the last produced map
        // The function's closing `}` is the first unindented `}` after the opening.
        .replace(
          /async function applyTransformers\(ctx, original, id, enforce = "default"\) \{[\s\S]*?\n\}/,
          [
            'async function applyTransformers(ctx, original, id, enforce = "default") {',
            '\tif (original.includes("@unocss-ignore")) return;',
            '\tconst transformers = (ctx.uno.config.transformers || []).filter((i) => (i.enforce || "default") === enforce);',
            '\tif (!transformers.length) return;',
            '\tlet code = original;',
            '\tlet s = new MagicString(code);',
            '\tlet map = null;',
            '\tfor (const t of transformers) {',
            '\t\tif (t.idFilter) {',
            '\t\t\tif (!t.idFilter(id)) continue;',
            '\t\t} else if (!ctx.filter(code, id)) continue;',
            '\t\tawait t.transform(s, id, ctx);',
            '\t\tif (s.hasChanged()) {',
            '\t\t\tcode = s.toString();',
            '\t\t\tmap = s.generateMap({ hires: true, source: id });',
            '\t\t\ts = new MagicString(code);',
            '\t\t}',
            '\t}',
            '\tif (code !== original) return { code, map };',
            '}',
          ].join('\n'),
        )
        // Change createTransformerPlugins transform hook from function-style to object-style
        // with a code filter so Rolldown can skip @unocss-ignore files at the native level.
        // Use \s* instead of literal \t for whitespace to be whitespace-agnostic.
        .replace(
          /transform\(code, id\) \{\s*return applyTransformers\(ctx, code, id, order\);\s*\},/,
          [
            'transform: {',
            "\t\t\t\tfilter: { code: { exclude: '@unocss-ignore' } },",
            '\t\t\t\thandler(code, id) {',
            '\t\t\t\t\treturn applyTransformers(ctx, code, id, order);',
            '\t\t\t\t}',
            '\t\t\t},',
          ].join('\n'),
        )
      return {
        code: targetCode,
      }
    },
  },
}
