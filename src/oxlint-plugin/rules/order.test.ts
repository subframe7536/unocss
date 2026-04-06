import { RuleTester } from 'oxlint/plugins-dev'

import rule from './order.ts'

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

tester.run('order-options', rule, {
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
