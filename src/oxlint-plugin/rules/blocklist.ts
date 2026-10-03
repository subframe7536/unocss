import type { ESTree, Rule } from '@oxlint/plugins'

import { blocklistClasses, CLASS_FIELDS } from './_.ts'

const rule: Rule = {
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
  createOnce(context) {
    function checkLiteral(node: ESTree.StringLiteral) {
      if (typeof node.value !== 'string' || !node.value.trim()) {
        return
      }

      for (const [name, meta] of blocklistClasses(context, node.value, context.filename)) {
        context.report({
          node,
          messageId: 'in-blocklist',
          data: { name, reason: meta?.message ? `: ${meta.message}` : '' },
        })
      }
    }

    return {
      JSXAttribute(node) {
        if (
          typeof node.name.name !== 'string' ||
          !CLASS_FIELDS.includes(node.name.name.toLowerCase()) ||
          !node.value
        ) {
          return
        }

        if (node.value.type === 'Literal') {
          checkLiteral(node.value)
        }
      },
    }
  },
}

export default rule
