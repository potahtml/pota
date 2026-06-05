import {
	promise,
	removeFromArray,
	window,
	withCache,
	withState,
} from '../lib/std.js'

import { document } from './dom.js'

export const CSSStyleSheet = window.CSSStyleSheet

/**
 * Creates tagged css and returns a CSSStyleSheet. Mostly for css
 * highlighting in js
 *
 * @param {TemplateStringsArray} template
 * @param {...any} values
 * @returns {CSSStyleSheet}
 * @url https://pota.quack.uy/use/css
 */
export const css = (template, ...values) =>
	sheet(String.raw({ raw: template }, ...values))

/**
 * Creates a stylesheet from a css string
 *
 * @param {string} css
 * @returns {CSSStyleSheet}
 * @url https://pota.quack.uy/use/css/sheet
 */
export const sheet = withCache(css => {
	const sheet = new CSSStyleSheet()
	/** Replace is asynchronous and can accept `@import` statements referencing external resources. */
	sheet.replace(css)

	return sheet
})

/**
 * Returns `adoptedStyleSheets` for a document
 *
 * @param {Document | ShadowRoot} document
 * @url https://pota.quack.uy/use/css/getAdoptedStyleSheets
 */
export const getAdoptedStyleSheets = document =>
	document?.adoptedStyleSheets

export const adoptedStyleSheets =
	/* #__PURE__*/ getAdoptedStyleSheets(document)

/**
 * Adds a style sheet to the document. Idempotent — adding the same
 * sheet twice leaves a single entry.
 *
 * @param {Document | ShadowRoot} document
 * @param {CSSStyleSheet} styleSheet
 * @url https://pota.quack.uy/use/css/addAdoptedStyleSheet
 */
export const addAdoptedStyleSheet = (document, styleSheet) => {
	const sheets = getAdoptedStyleSheets(document)
	if (!sheets.includes(styleSheet)) sheets.push(styleSheet)
}

/**
 * Removes a style sheet from the document
 *
 * @param {Document | ShadowRoot} document
 * @param {CSSStyleSheet} styleSheet
 * @url https://pota.quack.uy/use/css/removeAdoptedStyleSheet
 */
export const removeAdoptedStyleSheet = (document, styleSheet) =>
	removeFromArray(getAdoptedStyleSheets(document), styleSheet)

/**
 * Adds multiple stylesheets to a document or shadow root.
 *
 * @param {Document | ShadowRoot} document - The document or shadow
 *   root to add the stylesheets to.
 * @param {(CSSStyleSheet | string)[]} styleSheets - Array of
 *   stylesheets or stylesheet URLs to add.
 * @url https://pota.quack.uy/use/css/addStyleSheets
 */
export function addStyleSheets(document, styleSheets = []) {
	for (const sheet of styleSheets) {
		if (sheet) {
			sheet instanceof CSSStyleSheet
				? addAdoptedStyleSheet(document, sheet)
				: addStyleSheetExternal(document, sheet)
		}
	}
}

/**
 * Adds the stylesheet from urls. It uses a cache, to avoid having to
 * fire a request for each external sheet when used in more than one
 * custom element. Also, all reference the same object.
 *
 * @param {Document | ShadowRoot} document
 * @param {string} text
 * @url https://pota.quack.uy/use/css/addStyleSheetExternal
 */
export const addStyleSheetExternal = withState(
	(state, document, text) => {
		state
			.get(text, text =>
				text.startsWith('http')
					? fetch(text)
							.then(r => r.text())
							.then(css => sheet(css))
					: promise(resolve => resolve(sheet(text))),
			)
			.then(styleSheet => addAdoptedStyleSheet(document, styleSheet))
	},
)
