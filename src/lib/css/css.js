import { sheet } from './sheet.js'

/**
 * Creates tagged css and returns a CSSStyleSheet. Mostly for css
 * highlighting in js
 *
 * @param {TemplateStringsArray} template
 * @param {...any} values
 * @returns {CSSStyleSheet}
 */
export const css = (template, ...values) =>
	sheet(String.raw({ raw: template }, ...values))
