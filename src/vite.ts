/**
 * Vite plugin for UnoCSS — @unocss/vite bundled inline, inspector removed at build time.
 *
 * `@unocss/vite` is bundled directly into this module by tsdown.
 * `@unocss/inspector` is stubbed to a no-op during the build, so the inspector is
 * never loaded regardless of configuration.
 */
export * from '@unocss/vite'
export { default } from '@unocss/vite'
