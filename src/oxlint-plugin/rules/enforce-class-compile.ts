import type { Context } from '@oxlint/plugins'
import { defineRule } from './_'

export default defineRule({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Enforce class compilation',
      url: 'https://unocss.dev/integrations/eslint#rules',
    },
    messages: {
      missing: 'prefix: `{{prefix}}` is missing',
    },
    schema: [{
      type: 'object',
      properties: {
        prefix: {
          type: 'string',
        },
        enableFix: {
          type: 'boolean',
        },
      },
      additionalProperties: false,
    }],
    defaultOptions: [{ prefix: ':uno:', enableFix: true }],
  },
  createOnce(context: Context) {
    const [{ prefix = ':uno:', enableFix = true } = {}] = context.options as [{ prefix?: string, enableFix?: boolean }?]
    const CLASS_COMPILE_PREFIX = `${prefix} `

    function report({ node, fix }: { node: any, fix: (fixer: any) => any }) {
      context.report({
        node,
        loc: node.loc,
        messageId: 'missing',
        data: { prefix: CLASS_COMPILE_PREFIX.trim() },
        fix: (...args: any[]) => enableFix ? fix(...args) : null,
      } as any)
    }

    const scriptVisitor = {
      JSXAttribute(_node: any) {
        // todo: add support | NEED HELP
      },
      SvelteAttribute(_node: any) {
        // todo: add support | NEED HELP
      },
    }

    const reportClassList = (node: any, classList: string) => {
      if (classList.startsWith(CLASS_COMPILE_PREFIX))
        return

      report({
        node,
        fix(fixer: any) {
          return fixer.replaceTextRange([node.range[0] + 1, node.range[1] - 1], `${CLASS_COMPILE_PREFIX}${classList}`)
        },
      })
    }

    const templateBodyVisitor = {
      [`VAttribute[key.name=class]`](attr: any) {
        const valueNode = attr.value
        if (!valueNode || !valueNode.value)
          return

        reportClassList(valueNode, valueNode.value)
      },
      [`VAttribute[key.argument.name=class] VExpressionContainer Literal:not(ConditionalExpression .test Literal):not(Property .value Literal)`](
        literal: any,
      ) {
        if (!literal.value || typeof literal.value !== 'string')
          return

        reportClassList(literal, literal.value)
      },
      [`VAttribute[key.argument.name=class] VExpressionContainer TemplateElement`](
        templateElement: any,
      ) {
        if (!templateElement.value.raw)
          return

        reportClassList(templateElement, templateElement.value.raw)
      },
      [`VAttribute[key.argument.name=class] VExpressionContainer Property`](
        property: any,
      ) {
        if (property.key.type !== 'Identifier')
          return

        const classListString = property.key.name
        if (classListString.startsWith(CLASS_COMPILE_PREFIX))
          return

        report({
          node: property.key,
          fix(fixer: any) {
            let replacePropertyKeyText = `'${CLASS_COMPILE_PREFIX}${classListString}'`

            if (property.shorthand)
              replacePropertyKeyText = `${replacePropertyKeyText}: ${classListString}`

            return fixer.replaceTextRange(property.key.range, replacePropertyKeyText)
          },
        })
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

