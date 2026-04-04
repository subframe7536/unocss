import type { Linter, Rule } from 'eslint'

type UnocssEnforceClassCompile = [] | [{
  prefix?: string
  enableFix?: boolean
}]

type UnocssOrder = [] | [{
  unoFunctions?: string[]
  unoVariables?: string[]
}]

export interface UnoCSSEslintPlugin {
  rules: Record<string, Rule.RuleModule>
}

export interface UnoCSSEslintFlatConfig extends Linter.Config {
  plugins: {
    unocss: any
  }
  rules: {
    readonly 'unocss/order': Linter.RuleEntry<UnocssOrder>
    readonly 'unocss/order-attributify': Linter.RuleEntry<[]>
    readonly 'unocss/blocklist'?: Linter.RuleEntry<[]>
    readonly 'unocss/enforce-class-compile'?: Linter.RuleEntry<UnocssEnforceClassCompile>
  }
}

export interface UnoCSSEslintRecommendedConfig extends Linter.LegacyConfig {
  rules: {
    readonly '@unocss/order': Linter.RuleEntry<UnocssOrder>
    readonly '@unocss/order-attributify': Linter.RuleEntry<[]>
    readonly '@unocss/blocklist'?: Linter.RuleEntry<[]>
    readonly '@unocss/enforce-class-compile'?: Linter.RuleEntry<UnocssEnforceClassCompile>
  }
}

export interface UnoCSSEslintConfigs {
  recommended: UnoCSSEslintRecommendedConfig
  flat: UnoCSSEslintFlatConfig
}

export interface UnoCSSEslintPluginModule extends UnoCSSEslintPlugin {
  configs: UnoCSSEslintConfigs
}

// Augment ESLint's shared settings so IDEs can type-check unocss settings
declare module 'eslint' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Linter {
    interface Config {
      settings?: {
        unocss?: {
          configPath?: string
        }
        [key: string]: any
      }
    }
  }
}

export {}
