# @subf/unocss

A custom subset of UnoCSS packages.

If you are using `vue` or `svelte`, you should use `unocss` directly.

## Included

| Package                             | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `@unocss/core`                      | Core engine                                        |
| `@unocss/preset-wind3`              | Tailwind v3 preset                                 |
| `@unocss/preset-wind4`              | Tailwind v4 preset                                 |
| `@unocss/preset-icons`              | Pure CSS icons via Iconify                         |
| `@unocss/preset-web-fonts`          | Web fonts support                                  |
| `@unocss/transformer-variant-group` | Variant group transformer                          |
| `@unocss/transformer-directives`    | `@apply` directive transformer                     |
| `@unocss/reset`                     | CSS reset styles with `reset-*`, no sanitize entry |
| `unocss-preset-completion`          | Auto completion support for UnoCSS classes         |
| `@subf/unocss/vite`                 | Vite plugin, remove inspector                      |
| `@subf/unocss/oxlint-plugin`        | oxlint rules, `order` and `blocklist` rules only   |

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

The Vite plugin is a drop-in replacement for `@unocss/vite` with the following changes:

- Remove inspector
- Remove `VueScopePlugin`
- Remove `@unocss-skip-start` / `@unocss-skip-end` range comments support

```ts
// vite.config.ts
import UnoCSS from '@subf/unocss/vite'

export default {
  plugins: [UnoCSS()],
}
```

### Reset

```ts
import '@subf/unocss/reset-tailwind.css'
import 'uno.css'
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
