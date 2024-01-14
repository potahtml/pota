/**
 * Creates a stylesheet from a css string
 *
 * @param {string} css
 * @returns {CSSStyleSheet}
 */

export function sheet(css) {
	const sheet = new CSSStyleSheet()
	sheet.replace(css)
	return sheet
}
