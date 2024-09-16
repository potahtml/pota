import { JSDOM } from 'jsdom'
import { error } from './utils.js'

const Element = new JSDOM(`<!DOCTYPE html>`).window.document.body

export function validatePartial(path, html) {
	// partial validation
	const clean = html
		// remove content that isnt in between tags
		.replace(/^([^<]+)/, '')
		.replace(/([^>]+)$/, '')
		// remove content in between tags
		.replace(/>([^<]+)</gi, '><')

		// remove attributes
		.replace(/<([a-z0-9-]+)\s+[^>]+>/gi, '<$1>')

		// fix tables rows
		.replace(/^<tr>/i, '<table><tbody><tr>')
		.replace(/<\/tr>$/i, '</tr></tbody></table>')
		// fix tables cells
		.replace(/^<td>/i, '<table><tbody><tr><td>')
		.replace(/<\/td>$/i, '</td></tr></tbody></table>')

	Element.innerHTML = clean
	const result = Element.innerHTML

	if (result !== clean) {
		console.warn('-'.repeat(80))
		console.warn('User HTML:\n', clean)
		console.warn('Browser HTML:\n', result)
		console.warn('Original HTML:\n', html)

		error(
			path,
			'\nThe HTML provided is malformed and will yield unexpected output when evaluated by a browser.',
		)
	}
}
