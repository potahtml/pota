import { error } from './utils.js'

import { isPartial } from './partial.js'

const voidElements = new Set([
	'area',
	'base',
	'basefont',
	'bgsound',
	'br',
	'col',
	'command',
	'embed',
	'frame',
	'hr',
	'image',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
])
export function isVoidElement(tagName) {
	return voidElements.has(tagName.toLowerCase())
}

/** Escapes `&`, `<`, `>`, `'`, `"` */
export const escapeHTML = (() => {
	const chars = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;',
	}

	const search = /[&<>'"]/g
	const replace = c => chars[c]

	return function (s) {
		return s.replace(search, replace)
	}
})()
