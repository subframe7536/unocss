# @subf/unocss

A focused subset of [UnoCSS](https://unocss.dev) bundled into a single package.

## Included

| Package | Description |
|---------|-------------|
| `@unocss/core` | Core engine |
| `@unocss/preset-wind3` | Tailwind v3 / Windi CSS preset |
| `@unocss/preset-icons` | Pure CSS icons via Iconify |
| `@unocss/preset-web-fonts` | Web fonts support |
| `@unocss/transformer-variant-group` | Variant group transformer |
| `@unocss/transformer-directives` | `@apply` directive transformer |
| `@unocss/vite` | Vite plugin (**inspector disabled**) |
| oxlint-plugin | ESLint/oxlint rules (**no `@typescript-eslint/utils`**, oxlint-optimized) |

## Install

```bash
npm install @subf/unocss
# or
bun add @subf/unocss
```

## Usage

### Core + Presets

```ts
import { defineConfig, presetIcons, presetWebFonts, presetWind3, transformerDirectives, transformerVariantGroup } from '@subf/unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons(),
    presetWebFonts(),
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
```

### Vite Plugin

The Vite plugin is a drop-in replacement for `@unocss/vite` with the inspector permanently disabled.

```ts
// vite.config.ts
import UnoCSS from '@subf/unocss/vite'

export default {
  plugins: [UnoCSS()],
}
```

### Oxlint Plugin

Compatible with [oxlint](https://oxc.rs/docs/guide/usage/linter) JS plugins and [ESLint](https://eslint.org) flat config.

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: ['@subf/unocss/oxlint-plugin'],
})
```

Or with ESLint flat config:

```js
// eslint.config.js
import unocss from '@subf/unocss/oxlint-plugin'

export default [
  unocss.configs.flat,
]
```

## Building

```bash
bun run build
```

## Releasing

```bash
bun run release
```

## License

MIT
