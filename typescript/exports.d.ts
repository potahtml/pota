/** Export ambient(d.ts files without exports) here */

/// <reference path="./public/pota.d.ts" />
/// <reference path="./public/components.d.ts" />
/// <reference path="./jsx/namespace.d.ts" />

/** THIS MAY SHOW AS AN ERROR BUT ITS ACTUALLY CORRECT */

/** Export modules here */

export { derived } from './private/derived.d.ts'
export { action } from './private/action.d.ts'

export * from '../generated/types/exports.d.ts'
// Re-exported so consumers can write `declare module 'pota'`
export { JSX }
