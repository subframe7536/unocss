# Repository Guidelines

## Project Structure & Module Organization

`@subf/unocss` is an ESM-only TypeScript package providing a focused UnoCSS subset.

- `src/index.ts` exposes core APIs, presets, and transformers.
- `src/vite.ts` exposes the Vite integration; `src/rolldown-plugin-vite-patch.ts` patches upstream code during bundling.
- `src/oxlint-plugin/` contains the plugin entry, worker, and `rules/` implementations with colocated tests.
- `tsdown.config.ts` defines bundles and generates CSS reset entry files in `dist/`. Treat `dist/` as generated output.
- Root configuration files control TypeScript, linting, formatting, and UnoCSS. `.github/workflows/Release.yml` handles tagged releases.

## Build, Test, and Development Commands

Use the pnpm version pinned in `package.json` and Node.js 24, matching release CI.

- `pnpm install`: install dependencies using `pnpm-lock.yaml`.
- `pnpm dev`: rebuild bundles when source files change.
- `pnpm build`: generate ESM bundles, declarations, and reset styles.
- `pnpm typecheck`: check TypeScript without emitting files.
- `pnpm test`: run tests through Node's built-in test runner.
- `pnpm lint`: run Oxlint with automatic fixes.
- `pnpm format`: format files with Oxfmt.
- `pnpm qa`: run type checking, lint fixes, and formatting sequentially. Review resulting edits before committing.

## Coding Style & Naming Conventions

Follow existing TypeScript conventions: two-space indentation, single quotes, and no semicolons. Oxfmt and Oxlint inherit shared settings from `@subf/config`. Keep imports grouped by origin and use `import type` for type-only dependencies. Use camelCase for functions and variables, PascalCase for types, and descriptive kebab-case filenames where appropriate. Preserve strict typing; write code, comments, and documentation in English.

## Testing Guidelines

Colocate tests as `*.test.ts`; existing rule tests use `RuleTester` from `oxlint/plugins-dev`. Cover valid inputs, expected diagnostics, options, and exact autofix output when applicable. No coverage threshold is configured. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` for source changes, especially changes to workers or upstream Vite patches.

## Commit & Pull Request Guidelines

Follow the history's Conventional Commit pattern: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, or `ci:`. Add a scope when useful, for example `fix(vite-patch): handle transformer output`.

Keep pull requests focused. Describe the problem, resulting behavior, and validation performed; link related issues. Update `README.md` when public exports or usage change. Avoid committing generated bundles or unrelated formatting changes.
