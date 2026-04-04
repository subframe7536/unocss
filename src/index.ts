import type { UserConfig } from '@unocss/core'
import type { Theme } from '@unocss/preset-wind3'

export * from '@unocss/core'
export { default as presetIcons } from '@unocss/preset-icons'
export { default as presetWebFonts } from '@unocss/preset-web-fonts'
export { default as presetWind3 } from '@unocss/preset-wind3'
export type { Theme as PresetWind3Theme } from '@unocss/preset-wind3'
export { default as transformerDirectives } from '@unocss/transformer-directives'
export { default as transformerVariantGroup } from '@unocss/transformer-variant-group'

/**
 * Define UnoCSS config (typed with wind3 theme)
 */
export function defineConfig<T extends object = Theme>(config: UserConfig<T>) {
  return config
}
