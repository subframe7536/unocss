import type { Rule } from '@oxlint/plugins'

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
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        if (
          typeof node.name.name !== 'string' ||
          !CLASS_FIELDS.includes(node.name.name.toLowerCase()) ||
          !node.value
        ) {
          return
        }

        if (node.value?.type === 'Literal') {
          const literalNode = node.value
          if (typeof literalNode.value !== 'string' || !literalNode.value.trim()) {
            return
          }

          for (const [name, meta] of blocklistClasses(
            context,
            literalNode.value,
            context.filename,
          )) {
            context.report({
              node,
              messageId: 'in-blocklist',
              data: { name, reason: meta?.message ? `: ${meta.message}` : '' },
            })
          }
        }
      },
    }
  },
}

export default rule
