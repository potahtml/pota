/// <reference path="./namespace.d.ts" />
/// <reference path="./components.d.ts" />

/**
 * Needed so LSP works with `JSX` element tags, typescript needs the
 * `jsxs` functions to be defined.
 */
export function jsx(type: JSX.ElementType, props?: any): JSX.Element

export { jsx as jsxs, jsx as jsxDEV }

export { JSX }
