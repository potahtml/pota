import { serialize } from 'parse5'

import { error } from './utils.js'
import { parsePartial } from './walk.js'

/**
 * Validates HTML content, ensuring it's well-formed and will be
 * parsed correctly by a browser. It cleans the HTML by removing
 * non-tag content and attributes, and then compares it with the
 * browser's parsed version. If discrepancies are found, it logs a
 * warning and throws an error indicating malformed HTML.
 *
 * Parsing uses a `<template>` context element (the runtime parses
 * partials via `template.innerHTML`), so bare table content
 * (`<tr>`, `<td>`, `<col>`…) is legal as written.
 *
 * @param {any} path - Babel path
 * @param {string} html - The HTML string to validate.
 * @param {string} [xmlns] - Namespace of the partial, if any.
 */
export function validatePartial(path, html, xmlns) {
	// partial validation
	const clean = html
		// remove content that isnt in between tags
		.replace(/^[^<]+/, '#text')
		.replace(/[^>]+$/, '#text')
		// remove content in between tags
		.replace(/>[^<]+</gi, '>#text<')

		// remove attributes
		// todo remove me once validation string doesnt contain attributes
		.replace(/\s[a-z0-9-:]+="[^"]+"/gi, '')
		.replace(/\s[a-z0-9-:]+='[^']+'/gi, '')
		.replace(/<([a-z0-9-:]+)\s+[^>]+>/gi, '<$1>')

	const browser = serialize(parsePartial(clean, xmlns))

	if (browser.toLowerCase() !== clean.toLowerCase()) {
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
