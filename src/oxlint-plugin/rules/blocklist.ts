import { defineRule } from '@oxlint/plugins'
import type { Context } from '@oxlint/plugins'

import { CLASS_FIELDS } from '../constants'

import { syncAction } from './_'

export default defineRule({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Utilities in UnoCSS blocklist',
      url: 'https://unocss.dev/integrations/eslint#rules',
    },
    messages: {
      'in-blocklist': '"{{name}}" is in blocklist{{reason}}',
    },
    schema: [],
    defaultOptions: [],
  },
  createOnce(context: Context) {
    const checkLiteral = (node: any) => {
      if (typeof node.value !== 'string' || !node.value.trim()) {
        return
      }
      const input = node.value

      const blocked = syncAction(
        (context as any).settings?.unocss?.configPath,
        'blocklist',
        input,
        context.filename,
      )
      blocked.forEach(([name, meta]: [string, any]) => {
        context.report({
          node,
          messageId: 'in-blocklist',
          data: { name, reason: meta?.message ? `: ${meta.message}` : '' },
        } as any)
      })
    }

    return {
      JSXAttribute(node) {
        if (
          typeof node.name.name === 'string' &&
          CLASS_FIELDS.includes(node.name.name.toLowerCase()) &&
          node.value
        ) {
          if (node.value.type === 'Literal') {
            checkLiteral(node.value)
          }
        }
      },
    }
  },
})
