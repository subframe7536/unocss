import { RuleTester } from 'oxlint/plugins-dev'

import rule from './blocklist.ts'

const tester = new RuleTester({
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})

tester.run('blocklist-jsx', rule, {
  valid: [
    `<div class="m1 mx1 mr-1"></div>`,
    `<div title="border"></div>`,
    `<div class></div>`,
    `<div class=" "></div>`,
  ],
  invalid: [
    ...['className', 'classList', 'CLASS'].map((attribute) => ({
      code: `<div ${attribute}="border"></div>`,
      errors: [{ messageId: 'in-blocklist', data: { name: 'border', reason: '' } }],
    })),
    {
      code: `<div class="border"></div>`,
      errors: [
        {
          messageId: 'in-blocklist',
          data: {
            name: 'border',
            reason: '',
          },
          column: 11,
          endColumn: 19,
        },
      ],
    },
    {
      name: 'with reason',
      code: `<div class="bg-red-500"></div>`,
      errors: [
        {
          messageId: 'in-blocklist',
          data: {
            name: 'bg-red-500',
            reason: ': Use bg-red-600 instead',
          },
        },
      ],
    },
    {
      name: 'dynamic blocklist with message',
      code: `<div class="text-red"></div>`,
      errors: [
        {
          messageId: 'in-blocklist',
          data: {
            name: 'text-red',
            reason: ': Use color-* instead',
          },
        },
      ],
    },
    {
      name: 'dynamic blocklist with dynamic message',
      code: `<div class="h-auto"></div>`,
      errors: [
        {
          messageId: 'in-blocklist',
          data: {
            name: 'h-auto',
            reason: ': Use h-a instead',
          },
        },
      ],
    },
  ],
})

tester.run('blocklist-configPath', rule, {
  valid: [
    {
      code: `<div class="border"></div>`,
      settings: {
        unocss: { configPath: 'src/oxlint-plugin/rules/fixtures/explicit.config.ts' },
      },
      filename: '/other-project/src/index.tsx',
    },
  ],
  invalid: [
    {
      code: `<div class="forbidden"></div>`,
      settings: {
        unocss: { configPath: 'src/oxlint-plugin/rules/fixtures/explicit.config.ts' },
      },
      filename: '/other-project/src/index.tsx',
      errors: [{ messageId: 'in-blocklist', data: { name: 'forbidden', reason: '' } }],
    },
  ],
})
