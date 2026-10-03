import type { UserConfig } from '@unocss/core'

export default {
  rules: [
    ['first', { display: 'block' }],
    ['second', { display: 'flex' }],
  ],
  blocklist: ['forbidden'],
} satisfies UserConfig
