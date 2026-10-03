import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Context, ESTree } from '@oxlint/plugins'
import type { BlocklistMeta } from '@unocss/core'
import { createSyncFn } from 'synckit'

export const UNO_FUNCTIONS = ['clsx', 'classnames', 'cn', 'cls', 'cva']
export const UNO_VARIABLES = ['^cls', 'classNames?$']
export const CLASS_FIELDS = ['class', 'classname', 'classlist']

const syncAction = createSyncFn(
  process.env.NODE_ENV === 'production'
    ? join(fileURLToPath(new URL('.', import.meta.url)), 'worker.mjs')
    : join(fileURLToPath(new URL('..', import.meta.url)), 'worker.ts'),
)
export function sortClasses(context: Context, classes: string, id?: string): string {
  return syncAction(
    'sort',
    (context.settings?.unocss as { configPath?: string })?.configPath,
    classes,
    id,
  )
}

export function blocklistClasses(
  context: Context,
  classes: string,
  id?: string,
): [string, BlocklistMeta | undefined][] {
  return syncAction(
    'blocklist',
    (context.settings?.unocss as { configPath?: string })?.configPath,
    classes,
    id,
  )
}

export function isSimpleTemplateLiteral(node: ESTree.TemplateLiteral) {
  return node.expressions.length === 0 && node.quasis.length === 1
}

export function isStringRaw(tag: ESTree.Expression) {
  return (
    tag.type === 'MemberExpression' &&
    tag.object.type === 'Identifier' &&
    tag.object.name === 'String' &&
    tag.property.type === 'Identifier' &&
    tag.property.name === 'raw'
  )
}

export function isPossibleLiteral(
  node: ESTree.Node,
): node is ESTree.StringLiteral | ESTree.TemplateLiteral | ESTree.TaggedTemplateExpression {
  return (
    node.type === 'Literal' ||
    node.type === 'TemplateLiteral' ||
    node.type === 'TaggedTemplateExpression'
  )
}
