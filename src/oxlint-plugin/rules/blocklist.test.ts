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
  valid: [`<div class="m1 mx1 mr-1"></div>`],
  invalid: [
    {
      code: `<div class="border"></div>`,
      errors: [
        {
          messageId: 'in-blocklist',
          data: {
            name: 'border',
            reason: '',
          },
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
