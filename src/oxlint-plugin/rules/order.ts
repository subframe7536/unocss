import type { Context } from '@oxlint/plugins'
import type { SvelteAttribute, SvelteLiteral, SvelteMustacheTag } from 'svelte-eslint-parser/lib/ast/html'
import { AST_NODES_WITH_QUOTES, AST_TOKEN_TYPES, CLASS_FIELDS } from '../constants'
import { defineRule, syncAction } from './_'

export default defineRule({
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description: 'Order of UnoCSS utilities in class attribute',
      url: 'https://unocss.dev/integrations/eslint#rules',
    },
    messages: {
      'invalid-order': 'UnoCSS utilities are not ordered',
    },
    schema: [
      {
        type: 'object',
        properties: {
          unoFunctions: {
            type: 'array',
            items: { type: 'string' },
          },
          unoVariables: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [
      {
        unoFunctions: ['clsx', 'classnames'],
        unoVariables: ['^cls', 'classNames?$'],
      },
    ],
  },
  createOnce(context: Context) {
    const [opts = {}] = context.options as [{ unoFunctions?: string[], unoVariables?: string[] }?]
    const { unoFunctions = ['clsx', 'classnames'], unoVariables = ['^cls', 'classNames?$'] } = opts

    const lowerFunctions = unoFunctions.map((name: string) => name.toLowerCase())
    function isUnoFunction(name: string) {
      return lowerFunctions.includes(name.toLowerCase())
    }

    const unoVariablesRegexes = unoVariables.map((regex: string) => new RegExp(regex, 'i'))
    function isUnoVariable(name: string) {
      return unoVariablesRegexes.some((reg: RegExp) => reg.test(name))
    }

    function checkLiteral(node: any | SvelteLiteral, addSpace?: 'before' | 'after') {
      if (typeof node.value !== 'string' || !node.value.trim())
        return
      const input = node.value
      let sorted = syncAction(
        (context as any).settings?.unocss?.configPath,
        'sort',
        input,
        context.filename,
      ).trim()

      if (addSpace === 'before')
        sorted = ` ${sorted}`
      else if (addSpace === 'after')
        sorted += ' '

      if (sorted !== input) {
        const nodeOrToken: any = node.type === 'SvelteLiteral'
          ? { type: AST_TOKEN_TYPES.String, value: node.value, loc: node.loc, range: node.range }
          : node

        context.report({
          node: nodeOrToken,
          loc: node.loc,
          messageId: 'invalid-order',
          fix(fixer: any) {
            if (AST_NODES_WITH_QUOTES.includes(node.type))
              return fixer.replaceTextRange([node.range[0] + 1, node.range[1] - 1], sorted)
            else
              return fixer.replaceText(nodeOrToken, sorted)
          },
        } as any)
      }
    }

    function checkTemplateElement(quasi: any) {
      const input = quasi.value.raw
      if (!input)
        return

      const getRange = () => {
        const text = (context as any).sourceCode.getText(quasi)
        const raw = quasi.value.raw
        if (!text.includes(raw))
          return
        const rawStart = text.indexOf(raw)
        const start = quasi.range[0] + rawStart
        const end = quasi.range[0] + rawStart + raw.length
        if (start < quasi.range[0] || end > quasi.range[1])
          return
        return [start, end] as const
      }
      const realRange = getRange()
      if (!realRange)
        return

      let sorted = syncAction(
        (context as any).settings?.unocss?.configPath,
        'sort',
        input,
        context.filename,
      ).trim()
      if (/^\s/.test(input))
        sorted = ` ${sorted}`
      if (/\s$/.test(input))
        sorted += ' '

      if (sorted !== input) {
        context.report({
          node: quasi,
          loc: quasi.loc,
          messageId: 'invalid-order',
          fix(fixer: any) {
            const realRange = getRange()
            if (!realRange)
              return null
            return fixer.replaceTextRange(realRange, sorted)
          },
        } as any)
      }
    }

    function isPossibleLiteral(node: any) {
      return node.type === 'Literal' || node.type === 'TemplateLiteral' || node.type === 'TaggedTemplateExpression'
    }
    function checkPossibleLiteral(...nodes: any[]) {
      nodes.forEach((node) => {
        if (!isPossibleLiteral(node))
          return

        if (node.type === 'Literal' && typeof node.value === 'string') {
          return checkLiteral(node)
        }

        const isSimpleTemplateLiteral = (node: any) => {
          return node.expressions.length === 0 && node.quasis.length === 1
        }
        if (node.type === 'TemplateLiteral' && isSimpleTemplateLiteral(node)) {
          return checkTemplateElement(node.quasis[0])
        }

        const isStringRaw = (tag: any) => {
          return tag.type === 'MemberExpression'
            && tag.object.type === 'Identifier' && tag.object.name === 'String'
            && tag.property.type === 'Identifier' && tag.property.name === 'raw'
        }
        if (node.type === 'TaggedTemplateExpression' && isStringRaw(node.tag) && isSimpleTemplateLiteral(node.quasi)) {
          return checkTemplateElement(node.quasi.quasis[0])
        }

        if (node.type === 'TemplateLiteral' && node.expressions.length > 0 && node.quasis.length > 0) {
          return void node.quasis.forEach((quasi: any) => {
            checkTemplateElement(quasi)
          })
        }
      })
    }

    const scriptVisitor = {
      JSXAttribute(node: any) {
        if (typeof node.name.name === 'string' && CLASS_FIELDS.includes(node.name.name.toLowerCase()) && node.value) {
          if (isPossibleLiteral(node.value))
            return checkPossibleLiteral(node.value)
          else if (node.value.type === 'JSXExpressionContainer' && isPossibleLiteral(node.value.expression))
            return checkPossibleLiteral(node.value.expression)
        }
      },
      SvelteAttribute(node: SvelteAttribute) {
        if (node.key.name === 'class') {
          if (!node.value.length)
            return

          function checkExpressionRecursively(expression: SvelteMustacheTag['expression']) {
            if (expression.type !== 'ConditionalExpression')
              return

            if (expression.consequent.type === 'Literal') {
              checkLiteral(expression.consequent)
            }
            if (expression.alternate) {
              if (expression.alternate.type === 'ConditionalExpression') {
                checkExpressionRecursively(expression.alternate)
              }
              else if (expression.alternate.type === 'Literal') {
                checkLiteral(expression.alternate)
              }
            }
          }

          ;(node.value).forEach((obj, i) => {
            if (obj.type === 'SvelteMustacheTag') {
              checkExpressionRecursively(obj.expression)
            }
            else if (obj.type === 'SvelteLiteral') {
              const addSpace: 'before' | 'after' | undefined
                = node.value?.[i - 1]?.type === 'SvelteMustacheTag'
                  ? 'before'
                  : node.value?.[i + 1]?.type === 'SvelteMustacheTag'
                    ? 'after'
                    : undefined
              checkLiteral(obj, addSpace)
            }
          })
        }
      },

      CallExpression(node: any) {
        if (!(node.callee.type === 'Identifier' && isUnoFunction(node.callee.name)))
          return

        node.arguments.forEach((arg: any) => {
          if (isPossibleLiteral(arg)) {
            return checkPossibleLiteral(arg)
          }

          if (arg.type === 'ConditionalExpression') {
            return checkPossibleLiteral(arg.consequent, arg.alternate)
          }

          if (arg.type === 'LogicalExpression') {
            return checkPossibleLiteral(arg.left, arg.right)
          }

          function handleObjectExpression(node: any) {
            node.properties.forEach((p: any) => {
              if (p.type !== 'Property')
                return

              if (isPossibleLiteral(p.value)) {
                return checkPossibleLiteral(p.value)
              }

              if (p.value.type === 'ObjectExpression') {
                return handleObjectExpression(p.value)
              }
            })

            const keys = node.properties.filter((p: any) => p.type === 'Property').map((p: any) => p.key)
            return checkPossibleLiteral(...keys)
          }

          if (arg.type === 'ObjectExpression') {
            return handleObjectExpression(arg)
          }

          if (arg.type === 'ArrayExpression') {
            return arg.elements.forEach((element: any) => {
              if (element && isPossibleLiteral(element)) {
                return checkPossibleLiteral(element)
              }
            })
          }
        })
      },

      VariableDeclarator(node: any) {
        if (node.id.type !== 'Identifier' || !node.init || !isUnoVariable(node.id.name))
          return

        if (isPossibleLiteral(node.init)) {
          return checkPossibleLiteral(node.init)
        }

        if (node.init.type === 'TSAsExpression' && isPossibleLiteral(node.init.expression)) {
          return checkPossibleLiteral(node.init.expression)
        }

        function handleObjectExpression(node: any) {
          node.properties.forEach((p: any) => {
            if (p.type !== 'Property')
              return

            if (isPossibleLiteral(p.value)) {
              return checkPossibleLiteral(p.value)
            }

            if (p.value.type === 'ObjectExpression') {
              return handleObjectExpression(p.value)
            }
          })
        }
        if (node.init.type === 'ObjectExpression') {
          return handleObjectExpression(node.init)
        }
        if (node.init.type === 'TSAsExpression' && node.init.expression.type === 'ObjectExpression') {
          return handleObjectExpression(node.init.expression)
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

