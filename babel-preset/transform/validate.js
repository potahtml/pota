import { error } from './utils.js'

import { parse, parseFragment, serialize } from 'parse5'

const bodyElement = parse(
	`<!DOCTYPE html><html><head></head><body></body></html>`,
	// @ts-ignore
).childNodes[1].childNodes[1]

function innerHTML(htmlFragment) {
	return serialize(parseFragment(bodyElement, htmlFragment))
}

export function validatePartial(path, html) {
	// partial validation
	let clean = html
		// remove content that isnt in between tags
		.replace(/^[^<]+/, '#text')
		.replace(/[^>]+$/, '#text')
		// remove content in between tags
		.replace(/>[^<]+</gi, '>#text<')

		// remove attributes
		.replace(/\s[a-z0-9-]+="[^"]+"/gi, '')
		.replace(/\s[a-z0-9-]+='[^']+'/gi, '')
		.replace(/<([a-z0-9-:]+)\s+[^>]+>/gi, '<$1>')

	// table cells
	if (/^<(td|th)>/.test(clean)) {
		clean = `<table><tbody><tr>${clean}</tr></tbody></table>`
	}

	// table rows
	if (/^<tr>/.test(clean)) {
		clean = `<table><tbody>${clean}</tbody></table>`
	}

	// table misc
	if (/^<col>/.test(clean)) {
		clean = `<table><colgroup>${clean}</colgroup></table>`
	}

	// table components
	if (/^<(thead|tbody|tfoot|colgroup|caption)>/.test(clean)) {
		clean = `<table>${clean}</table>`
	}

	const browser = innerHTML(clean)

	if (browser !== clean) {
		console.warn('-'.repeat(80))
		console.warn('User HTML:\n', clean)
		console.warn('Browser HTML:\n', browser)
		console.warn('Original HTML:\n', html)

		error(
			path,
			'\nThe HTML provided is malformed and will yield unexpected output when evaluated by a browser.',
		)
	}
}
