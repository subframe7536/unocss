import { definePlugin, eslintCompatPlugin } from '@oxlint/plugins'
import blocklist from './rules/blocklist'
import enforceClassCompile from './rules/enforce-class-compile'
import order from './rules/order'
import orderAttributify from './rules/order-attributify'

const oxlintPlugin = definePlugin({
  meta: { name: 'unocss' },
  rules: {
    order,
    'order-attributify': orderAttributify,
    blocklist,
    'enforce-class-compile': enforceClassCompile,
  },
})

/**
 * ESLint-compatible plugin.
 * `eslintCompatPlugin` adds ESLint `create` methods for rules that use `createOnce`.
 */
export const plugin = eslintCompatPlugin(oxlintPlugin)
