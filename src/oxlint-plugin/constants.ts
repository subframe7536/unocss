/**
 * Token types used in ESLint AST.
 * Mirrors the subset of AST_TOKEN_TYPES from @typescript-eslint/types
 * that the UnoCSS ESLint rules rely on.
 */
export const AST_TOKEN_TYPES = {
  String: 'String',
} as const

export const CLASS_FIELDS = ['class', 'classname']
export const AST_NODES_WITH_QUOTES = ['Literal', 'VLiteral']
