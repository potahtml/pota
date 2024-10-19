import { error } from './utils.js'

import * as parse5 from 'parse5'

const bodyElement = parse5.parse(
	`<!DOCTYPE html><html><head></head><body></body></html>`,
	// @ts-ignore
).childNodes[1].childNodes[1]

function innerHTML(htmlFragment) {
	/**
	 * Fragment will be parsed as if it was set to the `bodyElement`'s
	 * `innerHTML` property.
	 */
	const parsedFragment = parse5.parseFragment(
		bodyElement,
		htmlFragment,
	)

	return parse5.serialize(parsedFragment)
}

export function validatePartial(path, html) {
	// partial validation
	const clean = html
		// remove content that isnt in between tags
		.replace(/^[^<]+/, '#text')
		.replace(/[^>]+$/, '#text')
		// remove content in between tags
		.replace(/>[^<]+</gi, '>#text<')

		// remove attributes
		.replace(/\s[a-z0-9-]+="[^"]+"/gi, '')
		.replace(/\s[a-z0-9-]+='[^']+'/gi, '')
		.replace(/<([a-z0-9-:]+)\s+[^>]+>/gi, '<$1>')

		// fix tables rows
		.replace(/^<tr>/i, '<table><tbody><tr>')
		.replace(/<\/tr>$/i, '</tr></tbody></table>')
		// fix tables cells
		.replace(/^<td>/i, '<table><tbody><tr><td>')
		.replace(/<\/td>$/i, '</td></tr></tbody></table>')
		.replace(/^<th>/i, '<table><thead><tr><th>')
		.replace(/<\/th>$/i, '</th></tr></thead></table>')
		// col/colgroup
		.replace(/^<col>/i, '<table><colgroup><col>')
		.replace(/<\/col>$/i, '</col></colgroup></table>')
		.replace(/^<colgroup>/i, '<table><colgroup>')
		.replace(/<\/colgroup>$/i, '</colgroup></table>')
		// fix table components
		.replace(/^<thead>/i, '<table><thead>')
		.replace(/<\/thead>$/i, '</thead></table>')
		.replace(/^<tbody>/i, '<table><tbody>')
		.replace(/<\/tbody>$/i, '</tbody></table>')
		.replace(/^<tfoot>/i, '<table><tfoot>')
		.replace(/<\/tfoot>$/i, '</tfoot></table>')

	const result = innerHTML(clean)

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
