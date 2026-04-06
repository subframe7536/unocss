// TEST ONLY, DO NOT EDIT

import type { UserConfig } from '@unocss/core'
import { presetWind4 } from '@unocss/preset-wind4'

export default {
  presets: [presetWind4()],
  blocklist: [
    'border',
    ['bg-red-500', { message: 'Use bg-red-600 instead' }],
    [(i) => i.startsWith('text-'), { message: 'Use color-* instead' }],
    [(i) => i.endsWith('-auto'), { message: (s) => `Use ${s.replace(/-auto$/, '-a')} instead` }],
  ],
} satisfies UserConfig
