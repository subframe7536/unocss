# @subf/unocss

A focused subset of [UnoCSS](https://unocss.dev) bundled into a single package.

## Included

| Package                             | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `@unocss/core`                      | Core engine                                      |
| `@unocss/preset-wind3`              | Tailwind v3 preset                               |
| `@unocss/preset-wind4`              | Tailwind v4 preset                               |
| `@unocss/preset-icons`              | Pure CSS icons via Iconify                       |
| `@unocss/preset-web-fonts`          | Web fonts support                                |
| `@unocss/transformer-variant-group` | Variant group transformer                        |
| `@unocss/transformer-directives`    | `@apply` directive transformer                   |
| `unocss-preset-completion`          | Autocompletion support for UnoCSS classes        |
| `@subf/unocss/vite`                 | Vite plugin (**inspector disabled**)             |
| `@subf/unocss/oxlint-plugin`        | oxlint rules, `order` and `blocklist` rules only |

## Install

```bash
bun add @subf/unocss
```

## Usage

### Core + Presets

```ts
import {
  defineConfig,
  presetCompletion,
  presetIcons,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from '@subf/unocss'

export default defineConfig({
  presets: [presetWind4(), presetIcons(), presetWebFonts(), presetCompletion()],
  transformers: [transformerVariantGroup(), transformerDirectives()],
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

Oxlint rules for UnoCSS. Currently only includes `order` and `blocklist` rules, more to come in the future.

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [{ name: 'unocss', specifier: '@subf/unocss/oxlint-plugin' }],
  rules: {
    'unocss/order': 'error',
    'unocss/blocklist': ['error', { blocklist: ['!important'] }],
  },
})
```

## License

MIT
