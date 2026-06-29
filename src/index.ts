import type { UserConfig, Preset } from '@unocss/core'
import {
  presetObjectCompletion,
  presetDirectivesCompletion,
  presetFunctionCompletion,
} from 'unocss-preset-completion'

export * from '@unocss/core'
export { default as presetIcons } from '@unocss/preset-icons'
export { default as presetWebFonts } from '@unocss/preset-web-fonts'
export { default as presetWind3 } from '@unocss/preset-wind3'
export { default as presetWind4 } from '@unocss/preset-wind4'
export type { Theme as PresetWind3Theme } from '@unocss/preset-wind3'
export type { Theme as PresetWind4Theme } from '@unocss/preset-wind4'
export { default as transformerDirectives } from '@unocss/transformer-directives'
export { default as transformerVariantGroup } from '@unocss/transformer-variant-group'
export { default as transformerCompileClass } from '@unocss/transformer-compile-class'

export function presetCompletion(): Preset {
  return {
    name: 'unocss-preset-completion',
    presets: [presetObjectCompletion(), presetDirectivesCompletion(), presetFunctionCompletion()],
  }
}

/**
 * Define UnoCSS config (typed with wind3 theme)
 */
export function defineConfig<T extends object = object>(config: UserConfig<T>) {
  return config
}
