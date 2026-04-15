/// <reference path="./namespace.d.ts" />
/// <reference path="./components.d.ts" />

/**
 * Needed so LSP works with `JSX` element tags, typescript needs the
 * `jsxs` functions to be defined.
 */
export function jsx(type: JSX.ElementType, props?: any): JSX.Element

export { jsx as jsxs, jsx as jsxDEV }

/**
 * Re-exported from the runtime — used by the Babel preset's lowered
 * output for static templates (SVG/MathML/HTML partials).
 */
export function createPartial(
	content: string,
	propsData?: any,
): (props?: any) => JSX.Element

export { JSX }
