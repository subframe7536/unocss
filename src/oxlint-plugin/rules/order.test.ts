import { RuleTester } from 'oxlint/plugins-dev'

import rule from './order.ts'

const tester = new RuleTester({
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      lang: 'tsx',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})

tester.run('order-jsx', rule, {
  valid: [
    `<div class="m1 mx1 mr-1"></div>`,
    `<div className="m1 mx1 mr-1"></div>`,
    `<div class="m-class f-class"></div>`,
    `<div class={"m1 mx1 mr-1"}></div>`,
    `<div class={\`m1 mx1 mr-1\`}></div>`,
    `<div class={\`m1 mx1 mr-1 \${more}\`}></div>`,
  ],
  invalid: [
    ...['className', 'classList', 'CLASS'].map((attribute) => ({
      code: `<div ${attribute}="mx1 m1 mr-1"></div>`,
      output: `<div ${attribute}="m1 mx1 mr-1"></div>`,
      errors: [{ messageId: 'invalid-order' }],
    })),
    {
      code: `<div class="mx1 m1 mr-1"></div>`,
      output: `<div class="m1 mx1 mr-1"></div>`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
    {
      code: `<div class={"mx1 m1 mr-1"}></div>`,
      output: `<div class={"m1 mx1 mr-1"}></div>`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
    {
      code: `<div class={\`mx1 m1 mr-1\`}></div>`,
      output: `<div class={\`m1 mx1 mr-1\`}></div>`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
    {
      code: `<div class={\`mx1 m1 mr-1 \${more}\`}></div>`,
      output: `<div class={\`m1 mx1 mr-1 \${more}\`}></div>`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
  ],
})

tester.run('order-options-default', rule, {
  valid: [`clsx('m1 mx1 mr-1')`, `const cls = 'm1 mx1 mr-1'`],
  invalid: [
    {
      code: `clsx('mx1 m1 mr-1')`,
      output: `clsx('m1 mx1 mr-1')`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
    {
      code: `const cls = 'mx1 m1 mr-1'`,
      output: `const cls = 'm1 mx1 mr-1'`,
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
  ],
})

tester.run('order-options-custom', rule, {
  valid: [`myFn('m1 mx1 mr-1')`, `const myCls = 'm1 mx1 mr-1'`],
  invalid: [
    {
      code: `myFn('mx1 m1 mr-1')`,
      output: `myFn('m1 mx1 mr-1')`,
      options: [{ unoFunctions: ['myFn'] }],
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
    {
      code: `const myCls = 'mx1 m1 mr-1'`,
      output: `const myCls = 'm1 mx1 mr-1'`,
      options: [{ unoVariables: ['^myCls'] }],
      errors: [
        {
          messageId: 'invalid-order',
        },
      ],
    },
  ],
})

tester.run('order-unoVariables-typescript', rule, {
  valid: [
    `const clsButton = 'ml-1 mr-1' satisfies string`,
    `const buttonClassNames = { default: 'pl1 pr1' } satisfies object`,
    `const notSorted = 'mr-1 ml-1' satisfies string`,
  ],
  invalid: [
    ...['as const', 'satisfies string', 'as const satisfies string'].map((wrapper) => ({
      code: `const clsButton = 'mr-1 ml-1' ${wrapper}`,
      output: `const clsButton = 'ml-1 mr-1' ${wrapper}`,
      errors: [{ messageId: 'invalid-order' }],
    })),
    {
      code: `const clsButton = ('mr-1 ml-1' satisfies string) as string`,
      output: `const clsButton = ('ml-1 mr-1' satisfies string) as string`,
      errors: [{ messageId: 'invalid-order' }],
    },
    {
      // oxlint-disable-next-line no-template-curly-in-string
      code: 'const clsButton = `mr-1 ml-1 ${more}` as const satisfies string',
      // oxlint-disable-next-line no-template-curly-in-string
      output: 'const clsButton = `ml-1 mr-1 ${more}` as const satisfies string',
      errors: [{ messageId: 'invalid-order' }],
    },
    {
      code: `const buttonClassNames = { default: 'pr1 pl1', variants: { light: 'mr-1 ml-1' } } as const satisfies object`,
      output: `const buttonClassNames = { default: 'pl1 pr1', variants: { light: 'ml-1 mr-1' } } as const satisfies object`,
      errors: [{ messageId: 'invalid-order' }, { messageId: 'invalid-order' }],
    },
    {
      code: `const themeDashboard = { slots: { root: 'mr-1 ml-1' } } satisfies object`,
      output: `const themeDashboard = { slots: { root: 'ml-1 mr-1' } } satisfies object`,
      options: [{ unoVariables: ['^theme'] }],
      errors: [{ messageId: 'invalid-order' }],
    },
  ],
})

tester.run('order-configPath', rule, {
  valid: [],
  invalid: [
    {
      code: `clsx('second first')`,
      output: `clsx('first second')`,
      settings: {
        unocss: { configPath: 'src/oxlint-plugin/rules/fixtures/explicit.config.ts' },
      },
      filename: '/other-project/src/index.ts',
      errors: [{ messageId: 'invalid-order' }],
    },
  ],
})

for (const { name, configPath, valid, invalid } of [
  {
    name: 'default',
    configPath: 'uno.config.ts',
    valid: ['m-(1 2) hover:(ml-1 mr-1)'],
    invalid: [
      {
        input: 'hover:(mr-1 ml-1) m-(2 1)',
        sorted: 'm-(1 2) hover:(ml-1 mr-1)',
      },
    ],
  },
  {
    name: 'colon',
    configPath: 'src/oxlint-plugin/rules/fixtures/variant-group-colon.config.ts',
    valid: ['hover:(ml-1 mr-1)', 'hover-(flex m1 grid)', 'hover-(flex focus-(grid m1) m3)'],
    invalid: [
      {
        input: 'hover-(flex m1 grid) focus:(mr-1 ml-1)',
        sorted: 'hover-(flex m1 grid) focus:(ml-1 mr-1)',
      },
      {
        input: 'hover-(flex focus-(grid m1) m3) focus:(mr-1 ml-1)',
        sorted: 'hover-(flex focus-(grid m1) m3) focus:(ml-1 mr-1)',
      },
    ],
  },
  {
    name: 'dash',
    configPath: 'src/oxlint-plugin/rules/fixtures/variant-group-dash.config.ts',
    valid: ['hover:(flex m1 grid) m-(1 2)'],
    invalid: [
      {
        input: 'hover:(flex m1 grid) m-(2 1)',
        sorted: 'hover:(flex m1 grid) m-(1 2)',
      },
    ],
  },
  {
    name: 'disabled',
    configPath: 'src/oxlint-plugin/rules/fixtures/variant-group-disabled.config.ts',
    valid: ['hover:(flex m1 grid) hover-(flex m2 grid)'],
    invalid: [
      {
        input: 'hover:(flex m1 grid) hover-(flex m2 grid) mr-1 ml-1',
        sorted: 'hover:(flex m1 grid) hover-(flex m2 grid) ml-1 mr-1',
      },
    ],
  },
]) {
  const settings = { unocss: { configPath } }
  tester.run(`order-variant-group-${name}`, rule, {
    valid: valid.map((classes) => ({ code: `clsx('${classes}')`, settings })),
    invalid: invalid.map(({ input, sorted }) => ({
      code: `clsx('${input}')`,
      output: `clsx('${sorted}')`,
      settings,
      errors: [{ messageId: 'invalid-order' }],
    })),
  })
}
