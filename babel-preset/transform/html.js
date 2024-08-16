import { isValidHTMLNesting } from 'validate-html-nesting'

import { error } from './utils.js'

import { isPartialHTML } from './partial.js'

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

/** Validates html nesting */
export function validateHTML(parent, child, node) {
	if (
		!parent.includes('-') &&
		!child.includes('-') &&
		!isValidHTMLNesting(parent, child)
	) {
		error(
			node._path,
			`Invalid HTML: <${child}> cannot be child of <${parent}>`,
		)
	}
}

/** Validates if the tags in children are valid nesting for parent tag */
export function validateChildrenHTML(tagName, children) {
	for (const child of children) {
		if (isPartialHTML(child)) {
			validateHTML(tagName, child.tagName, child)
		}
	}
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
