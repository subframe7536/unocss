import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createSyncFn } from 'synckit'

export const syncAction = createSyncFn(
  join(fileURLToPath(new URL('.', import.meta.url)), 'worker.mjs'),
)
