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
