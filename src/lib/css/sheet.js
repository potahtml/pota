/**
 * Creates a stylesheet from a css string
 *
 * @param {string} css
 * @returns {CSSStyleSheet}
 */

export function sheet(css) {
	const sheet = new CSSStyleSheet()
	sheet.replace(css)
	// this is set here so the renderer can create a style tag when inlined
	sheet.textContent = css
	return sheet
}
