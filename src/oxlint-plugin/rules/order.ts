import type { ESTree, Range, Rule } from '@oxlint/plugins'

import {
  isPossibleLiteral,
  isSimpleTemplateLiteral,
  isStringRaw,
  sortClasses,
  CLASS_FIELDS,
  UNO_FUNCTIONS,
  UNO_VARIABLES,
} from './_'

const rule: Rule = {
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
        unoFunctions: UNO_FUNCTIONS,
        unoVariables: UNO_VARIABLES,
      },
    ],
  },
  createOnce(context) {
    const [opts = {}] = (context.options || []) as [
      { unoFunctions?: string[]; unoVariables?: string[] }?,
    ]
    const { unoFunctions = UNO_FUNCTIONS, unoVariables = UNO_VARIABLES } = opts

    const lowerFunctions = new Set(unoFunctions.map((name: string) => name.toLowerCase()))

    const unoVariablesRegexes = unoVariables.map((regex: string) => new RegExp(regex, 'i'))
    function isUnoVariable(name: string) {
      return unoVariablesRegexes.some((reg) => reg.test(name))
    }

    function checkLiteral(node: ESTree.StringLiteral, addSpace?: 'before' | 'after') {
      if (typeof node.value !== 'string' || !node.value.trim()) {
        return
      }
      const input = node.value
      let sorted = sortClasses(context, input, context.filename).trim()

      if (addSpace === 'before') {
        sorted = ` ${sorted}`
      } else if (addSpace === 'after') {
        sorted += ' '
      }

      if (sorted !== input) {
        context.report({
          node,
          loc: node.loc,
          messageId: 'invalid-order',
          fix(fixer) {
            if (node.type === 'Literal') {
              return fixer.replaceTextRange([node.range[0] + 1, node.range[1] - 1], sorted)
            } else {
              return fixer.replaceText(node, sorted)
            }
          },
        })
      }
    }

    function checkTemplateElement(quasi: ESTree.TemplateElement) {
      const input = quasi.value.raw
      if (!input) {
        return
      }

      const getRange = () => {
        const text = (context as any).sourceCode.getText(quasi)
        const raw = quasi.value.raw
        if (!text.includes(raw)) {
          return
        }
        const rawStart = text.indexOf(raw)
        const start = quasi.range[0] + rawStart
        const end = quasi.range[0] + rawStart + raw.length
        if (start < quasi.range[0] || end > quasi.range[1]) {
          return
        }
        return [start, end] as const
      }
      const realRange = getRange()
      if (!realRange) {
        return
      }

      let sorted = sortClasses(context, input, context.filename).trim()
      if (/^\s/.test(input)) {
        sorted = ` ${sorted}`
      }
      if (/\s$/.test(input)) {
        sorted += ' '
      }

      if (sorted !== input) {
        context.report({
          node: quasi,
          loc: quasi.loc,
          messageId: 'invalid-order',
          fix(fixer) {
            const realRange = getRange() as Range
            if (!realRange) {
              return null
            }
            return fixer.replaceTextRange(realRange, sorted)
          },
        })
      }
    }

    function checkPossibleLiteral(...nodes: ESTree.Node[]) {
      nodes.forEach((node) => {
        if (!isPossibleLiteral(node)) {
          return
        }

        if (node.type === 'Literal' && typeof node.value === 'string') {
          return checkLiteral(node)
        }

        if (node.type === 'TemplateLiteral' && isSimpleTemplateLiteral(node)) {
          return checkTemplateElement(node.quasis[0]!)
        }

        if (
          node.type === 'TaggedTemplateExpression' &&
          isStringRaw(node.tag) &&
          isSimpleTemplateLiteral(node.quasi)
        ) {
          return checkTemplateElement(node.quasi.quasis[0]!)
        }

        if (
          node.type === 'TemplateLiteral' &&
          node.expressions.length > 0 &&
          node.quasis.length > 0
        ) {
          return void node.quasis.forEach((quasi) => {
            checkTemplateElement(quasi)
          })
        }
      })
    }

    return {
      JSXAttribute(node) {
        if (
          typeof node.name.name === 'string' &&
          CLASS_FIELDS.includes(node.name.name.toLowerCase()) &&
          node.value
        ) {
          if (isPossibleLiteral(node.value)) {
            return checkPossibleLiteral(node.value)
          } else if (
            node.value.type === 'JSXExpressionContainer' &&
            isPossibleLiteral(node.value.expression)
          ) {
            return checkPossibleLiteral(node.value.expression)
          }
        }
      },

      CallExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          !lowerFunctions.has(node.callee.name.toLowerCase())
        ) {
          return
        }

        node.arguments.forEach((arg) => {
          if (isPossibleLiteral(arg)) {
            return checkPossibleLiteral(arg)
          }

          if (arg.type === 'ConditionalExpression') {
            return checkPossibleLiteral(arg.consequent, arg.alternate)
          }

          if (arg.type === 'LogicalExpression') {
            return checkPossibleLiteral(arg.left, arg.right)
          }

          function handleObjectExpression(node: ESTree.ObjectExpression) {
            node.properties.forEach((p) => {
              if (p.type !== 'Property') {
                return
              }

              if (isPossibleLiteral(p.value)) {
                return checkPossibleLiteral(p.value)
              }

              if (p.value.type === 'ObjectExpression') {
                return handleObjectExpression(p.value)
              }
            })

            const keys = node.properties
              .filter((p: any) => p.type === 'Property')
              .map((p: any) => p.key)
            return checkPossibleLiteral(...keys)
          }

          if (arg.type === 'ObjectExpression') {
            return handleObjectExpression(arg)
          }

          if (arg.type === 'ArrayExpression') {
            return arg.elements.forEach((element) => {
              if (element && isPossibleLiteral(element)) {
                return checkPossibleLiteral(element)
              }
            })
          }
        })
      },

      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init || !isUnoVariable(node.id.name)) {
          return
        }

        if (isPossibleLiteral(node.init)) {
          return checkPossibleLiteral(node.init)
        }

        if (node.init.type === 'TSAsExpression' && isPossibleLiteral(node.init.expression)) {
          return checkPossibleLiteral(node.init.expression)
        }

        function handleObjectExpression(node: ESTree.ObjectExpression) {
          node.properties.forEach((p) => {
            if (p.type !== 'Property') {
              return
            }

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
        if (
          node.init.type === 'TSAsExpression' &&
          node.init.expression.type === 'ObjectExpression'
        ) {
          return handleObjectExpression(node.init.expression)
        }
      },
    }
  },
}

export default rule
