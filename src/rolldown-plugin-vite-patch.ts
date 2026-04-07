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
        .replace(
          /function transformSkipCode\(code, map, SKIP_RULES_RE, keyFlag\) \{[\s\S]*?\treturn code;\n\}\nfunction restoreSkipCode\(code, map\) \{[\s\S]*?\treturn code;\n\}\n/,
          '',
        )
        // Simplify applyTransformers: remove skipMap/transformSkipCode/restoreSkipCode/maps/remapping
        // Step 1: replace the initialization block (skipMap + transformSkipCode call + maps array)
        .replace(
          /\tconst skipMap = \/\* @__PURE__ \*\/ new Map\(\);\n\tlet code = original;\n\tlet s = new MagicString\(transformSkipCode\(code, skipMap, SKIP_COMMENT_RE, "@unocss-skip-placeholder-"\)\);\n\tconst maps = \[\];\n/,
          '\tlet code = original;\n\tlet s = new MagicString(code);\n',
        )
        // Step 2: replace restoreSkipCode call with simple toString
        .replace(/code = restoreSkipCode\(s\.toString\(\), skipMap\)/g, 'code = s.toString()')
        // Step 3: remove maps.push(s.generateMap(...)) block
        .replace(/\t\t\tmaps\.push\(s\.generateMap\(\{\n\t\t\t\thires: true,\n\t\t\t\tsource: id\n\t\t\t\}\)\);\n/g, '')
        // Step 4: replace the return with remapping(...) with a simple { code } return
        .replace(
          /\tif \(code !== original\) return \{\n\t\tcode,\n\t\tmap: remapping\(maps, \(_, ctx\) => \{\n\t\t\tctx\.content = code;\n\t\t\treturn null;\n\t\t\}\)\n\t\};\n\}/,
          '\tif (code !== original) return { code };\n}',
        )
        // Change createTransformerPlugins transform hook from function-style to object-style
        // with a code filter so Rolldown can skip @unocss-ignore files at the native level
        .replace(
          /\t\t\ttransform\(code, id\) \{\n\t\t\t\treturn applyTransformers\(ctx, code, id, order\);\n\t\t\t\},/,
          [
            '\t\t\ttransform: {',
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
