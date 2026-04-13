/// <reference path="./public/pota.d.ts" />

/// <reference path="./public/components.d.ts" />
/// <reference path="./jsx/namespace.d.ts" />

/** THIS MAY SHOW AS AN ERROR BUT ITS ACTUALLY CORRECT */

export * from '../generated/types/exports.d.ts'

// Re-exported so consumers can write `declare module 'pota'`
// augmentations that reference JSX types (e.g. extending
// JSX.IntrinsicElements with custom elements).
export { JSX }
