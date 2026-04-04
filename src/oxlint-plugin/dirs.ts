import { fileURLToPath } from 'node:url'

/**
 * Resolves to the dist directory of this package at runtime.
 * Used to locate the worker.mjs file for synckit.
 */
export const distDir = fileURLToPath(new URL('.', import.meta.url))
