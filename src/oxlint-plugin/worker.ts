import { dirname } from 'node:path'
import process from 'node:process'

import { loadConfig } from '@unocss/config'
import type { BlocklistMeta, UnoGenerator } from '@unocss/core'
import { collapseVariantGroup, createGenerator, parseVariantGroup } from '@unocss/core'
import { runAsWorker } from 'synckit'

const promises = new Map<string, Promise<UnoGenerator<any>> | undefined>()

// bypass icon rules in ESLint
process.env.ESLINT ||= 'true'

function getSearchCwd(id: string): string {
  // Check if it's a virtual file path from ESLint processors
  const virtualMatch = id.match(/\.\w+\/[^/]+$/)

  if (virtualMatch) {
    const realPath = id.slice(0, id.lastIndexOf('/'))
    return dirname(realPath)
  }

  return dirname(id)
}

async function _getGenerator(configPath?: string, id?: string) {
  const searchFrom = configPath ? process.cwd() : id ? getSearchCwd(id) : process.cwd()

  const { config, sources } = await loadConfig(searchFrom, configPath)
  if (!sources.length) {
    throw new Error(
      '[@subf/unocss] No config file found, create a `uno.config.ts` file in your project root and try again.',
    )
  }
  return createGenerator({
    ...config,
    warn: false,
  })
}

function getCacheKey(configPath?: string, id?: string): string {
  if (configPath) {
    return `config:${configPath}`
  }
  if (id) {
    return `dir:${getSearchCwd(id)}`
  }
  return `cwd:${process.cwd()}`
}

export async function getGenerator(configPath?: string, id?: string) {
  const cacheKey = getCacheKey(configPath, id)
  let promise = promises.get(cacheKey)
  if (!promise) {
    promise = _getGenerator(configPath, id)
    promises.set(cacheKey, promise)
  }
  return await promise
}

/**
 * Sorts UnoCSS utility classes by their variant order and name.
 * Based on @unocss/virtual-shared/integration/sort-rules.
 */
async function actionSort(
  configPath: string | undefined,
  rules: string,
  id?: string,
): Promise<string> {
  const uno = await getGenerator(configPath, id)
  const unknown: string[] = []

  if (!uno.config.details) {
    uno.config.details = true
  }

  const variantGroup = uno.config.transformers?.find(
    (transformer) => transformer.name === '@unocss/transformer-variant-group',
  )

  let expandedResult: ReturnType<typeof parseVariantGroup> | undefined
  if (variantGroup) {
    // The transformer captures separators in its closure and exposes them through codeFilter.
    const separators = [':', '-'].filter(
      (separator) => variantGroup?.codeFilter?.(`${separator}(`, id || '') ?? true,
    )
    expandedResult = parseVariantGroup(rules, separators)
    rules = expandedResult.expanded
  }

  const result: Array<[number, string] | undefined> = []
  // Keep groups excluded by the transformer intact instead of sorting their inner tokens.
  const groups = [...parseVariantGroup(rules).groupsByOffset].sort(([a], [b]) => a - b)
  const arr: string[] = []
  let offset = 0
  for (const [start, group] of groups) {
    arr.push(...rules.slice(offset, start).split(/\s+/g), rules.slice(start, start + group.length))
    offset = start + group.length
  }
  arr.push(...rules.slice(offset).split(/\s+/g))

  for (const i of arr) {
    if (!i) {
      continue
    }
    const token = await uno.parseToken(i)
    if (!token) {
      unknown.push(i)
      result.push(undefined)
      continue
    }
    const variantRank = (token[0]?.[5]?.variantHandlers?.length || 0) * 100_000
    const order = (token[0]?.[0] ?? 0) + variantRank
    result.push([order, i])
  }

  let sorted = (result.filter(Boolean) as [number, string][])
    .sort((a, b) => {
      const diff = a[0] - b[0]
      return diff !== 0 ? diff : a[1].localeCompare(b[1])
    })
    .map((i) => i[1])
    .join(' ')

  if (expandedResult?.prefixes.length) {
    sorted = collapseVariantGroup(sorted, expandedResult.prefixes)
  }

  return [...unknown, sorted].join(' ').trim()
}

async function actionBlocklist(
  configPath: string | undefined,
  classes: string,
  id?: string,
): Promise<[string, BlocklistMeta | undefined][]> {
  const uno = await getGenerator(configPath, id)
  const blocked = new Map<string, BlocklistMeta | undefined>()

  const extracted = await uno.applyExtractors(classes, id)
  const values = [...extracted.values()]

  const getMeta = (raw: string, meta?: BlocklistMeta) => {
    return meta?.message
      ? {
          ...meta,
          message: typeof meta.message === 'function' ? meta.message(raw) : meta.message,
        }
      : meta
  }

  const matchBlocked = async (raw: string) => {
    if (blocked.has(raw)) {
      return
    }
    const rule = uno.getBlocked(raw)
    if (rule) {
      blocked.set(raw, getMeta(raw, rule[1]))
      return
    }
    let current = raw
    for (const p of uno.config.preprocess) {
      current = p(raw)!
    }
    const results = await uno.matchVariants(raw, current)
    const rules = results.map((r) => r && uno.getBlocked(r[1]))

    for (const rule of rules) {
      if (rule) {
        blocked.set(raw, getMeta(raw, rule[1]))
      }
    }
  }

  await Promise.all(values.map(matchBlocked))

  return [...blocked]
}

export function run(
  action: 'sort',
  configPath: string | undefined,
  classes: string,
  id?: string,
): string
export function run(
  action: 'blocklist',
  configPath: string | undefined,
  classes: string,
  id?: string,
): [string, BlocklistMeta | undefined][]
export function run(action: string, ...args: any[]): any {
  switch (action) {
    case 'sort':
      // @ts-expect-error cast
      return actionSort(...args)
    case 'blocklist':
      // @ts-expect-error cast
      return actionBlocklist(...args)
  }
}

runAsWorker(run)
