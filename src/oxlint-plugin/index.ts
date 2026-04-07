import type { Plugin } from '@oxlint/plugins'

import blocklist from './rules/blocklist'
import order from './rules/order'

const plugin: Plugin = {
  meta: { name: 'unocss' },
  rules: {
    order,
    blocklist,
  },
}

export default plugin
