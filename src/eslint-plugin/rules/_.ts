import type { run } from '../worker'
import { join } from 'node:path'
import { createSyncFn } from 'synckit'
import { distDir } from '../dirs'

export const syncAction = createSyncFn(join(distDir, 'worker.mjs')) as typeof run

/**
 * Merges a user-provided option with its default value.
 * For plain objects, performs a shallow merge (default values are overridden by user values).
 */
function mergeOption<T>(user: T | undefined, def: T): T {
  if (user === undefined)
    return def
  if (typeof def === 'object' && def !== null && !Array.isArray(def))
    return { ...(def as object), ...(user as object) } as T
  return user
}

/**
 * Creates an ESLint-compatible rule definition.
 *
 * Replacement for `RuleCreator` from `@typescript-eslint/utils/eslint-utils`.
 * Compatible with both ESLint flat config and oxlint JS plugins.
 */
export function createRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(rule: {
  name?: string
  meta: {
    type: string
    fixable?: 'code' | 'whitespace'
    hasSuggestions?: boolean
    docs?: { description?: string; url?: string }
    messages: Record<TMessageIds, string>
    schema: unknown[]
    defaultOptions?: TOptions
  }
  create: (context: any, options: TOptions) => any
}) {
  return {
    meta: {
      ...rule.meta,
      docs: {
        url: 'https://unocss.dev/integrations/eslint#rules',
        ...rule.meta.docs,
      },
    },
    create(context: any) {
      const defaultOptions = (rule.meta.defaultOptions ?? []) as TOptions
      const options = defaultOptions.map((def, i) =>
        mergeOption(context.options[i], def),
      ) as TOptions
      return rule.create(context, options)
    },
  }
}
