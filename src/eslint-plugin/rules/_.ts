import type { run } from '../worker'
import { join } from 'node:path'
import { defineRule } from '@oxlint/plugins'
import { createSyncFn } from 'synckit'
import { distDir } from '../dirs'

export const syncAction = createSyncFn(join(distDir, 'worker.mjs')) as typeof run

export { defineRule }
