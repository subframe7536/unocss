import type { UnoCSSEslintConfigs } from './types'
import configsFlat from './configs/flat'
import configsRecommended from './configs/recommended'
import { plugin } from './plugin'
import './types'

export type {
  UnoCSSEslintConfigs,
  UnoCSSEslintFlatConfig,
  UnoCSSEslintPlugin,
  UnoCSSEslintPluginModule,
  UnoCSSEslintRecommendedConfig,
} from './types'

export const configs: UnoCSSEslintConfigs = {
  recommended: configsRecommended,
  flat: configsFlat,
}

export default {
  ...plugin,
  configs,
}
