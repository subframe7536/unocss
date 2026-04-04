import type { Context } from '@oxlint/plugins'
import { CLASS_FIELDS } from '../constants'
import { defineRule, syncAction } from './_'
import { IGNORE_ATTRIBUTES } from './order-attributify'

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
      if (typeof node.value !== 'string' || !node.value.trim())
        return
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

    const scriptVisitor = {
      JSXAttribute(node: any) {
        if (typeof node.name.name === 'string' && CLASS_FIELDS.includes(node.name.name.toLowerCase()) && node.value) {
          if (node.value.type === 'Literal')
            checkLiteral(node.value)
        }
      },
      SvelteAttribute(node: any) {
        if (node.key.name === 'class') {
          if (node.value?.[0].type === 'SvelteLiteral')
            checkLiteral(node.value[0])
        }
      },
    }

    const templateBodyVisitor = {
      VAttribute(node: any) {
        if (node.key.name === 'class') {
          if (node.value.type === 'VLiteral')
            checkLiteral(node.value)
        }
      },
      // Attributify
      VStartTag(node: any) {
        const valueless = node.attributes.filter((i: any) =>
          typeof i.key?.name === 'string'
          && !IGNORE_ATTRIBUTES.includes(i.key?.name?.toLowerCase())
          && i.value == null,
        )
        if (!valueless.length)
          return

        for (const node of valueless) {
          if (!node?.key?.name)
            continue
          const blocked = syncAction(
            (context as any).settings?.unocss?.configPath,
            'blocklist',
            node.key.name,
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
      },
    }

    const parserServices = (context as any)?.sourceCode?.parserServices || (context as any).parserServices
    // @ts-expect-error missing-types
    if (parserServices == null || parserServices.defineTemplateBodyVisitor == null) {
      return scriptVisitor
    }
    else {
      // For Vue
      // @ts-expect-error missing-types
      return parserServices?.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
    }
  },
})

