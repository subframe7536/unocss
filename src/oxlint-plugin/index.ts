import { definePlugin, eslintCompatPlugin } from '@oxlint/plugins'

import blocklist from './rules/blocklist'
import order from './rules/order'

const oxlintPlugin = definePlugin({
  meta: { name: 'unocss' },
  rules: {
    order,
    blocklist,
  },
})

/**
 * ESLint-compatible plugin.
 * `eslintCompatPlugin` adds ESLint `create` methods for rules that use `createOnce`.
 */
const plugin = eslintCompatPlugin(oxlintPlugin)

export default plugin
