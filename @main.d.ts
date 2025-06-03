/** The original typings of the export */
export * from './pota.d.ts'

/** The original typings of the export */
export * from './types/@main.d.ts'

/**
 * Needed to support `JSX` from default export, such
 *
 * ```ts
 * declare module 'pota' {
 * 	namespace JSX {
 * 		//...
 * 	}
 * }
 * ```
 */
export * from './src/jsx/jsx.d.ts'

/**
 * Needed so LSP works with `JSX` element tags, typescript needs the
 * `jsxs` functions to be defined.
 */
export * from './types/jsx/jsx-runtime.d.ts'
