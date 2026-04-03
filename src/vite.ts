import type { UserConfigDefaults } from '@unocss/core'
import type { Plugin } from 'vite'
import type { VitePluginConfig } from '@unocss/vite'
import UnocssVitePlugin from '@unocss/vite'

// Re-export all named exports from @unocss/vite (types, helpers, etc.)
export * from '@unocss/vite'

/**
 * Vite plugin for UnoCSS without the inspector.
 *
 * Drop-in replacement for `@unocss/vite` with inspector disabled by default.
 */
export default function UnocssPlugin<Theme extends object>(
  configOrPath?: VitePluginConfig<Theme> | string,
  defaults: UserConfigDefaults = {},
): Plugin[] {
  // Merge inspector: false into the config to strip inspector support
  const config: typeof configOrPath
    = configOrPath && typeof configOrPath !== 'string'
      ? { ...configOrPath, inspector: false as const }
      : configOrPath

  return UnocssVitePlugin(config as any, defaults)
}
