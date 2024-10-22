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
	// 'image', in svg is not void
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
	return voidElements.has(tagName)
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
