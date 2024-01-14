/**
 * Creates tagged css and returns a string. Mostly for css
 * highlighting in js
 *
 * @param {TemplateStringsArray} template
 * @param {...any} values
 * @returns {string}
 */
export function css(template, ...values) {
	return String.raw({ raw: template }, ...values)
}
