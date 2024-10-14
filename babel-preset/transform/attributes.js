import { types as t } from '@babel/core'

/** Merges attributes into partial */
export function buildAttributeIntoTag(tag, name, value) {
	if (value.trim() === '') {
		tag.content += ' ' + name
		return
	}

	if (/"|'|=|<|>|`|\s/.test(value)) {
		tag.content += ' ' + name + "='" + escapeAttribute(value) + "'"
		return
	}

	tag.content += ' ' + name + '=' + value
}

/** If value is string or number */
export function isAttributeLiteral(node) {
	return (
		t.isStringLiteral(node.value) ||
		t.isNumericLiteral(node.value) ||
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression) ||
		// <input autofocus/> (it doesnt have a value)
		node.value === null
	)
}

/** Get attribute string or number */
export function getAttributeLiteral(node) {
	// <input autofocus/> (it doesnt have a value)
	if (node.value === null) {
		return ''
	}

	if (
		t.isStringLiteral(node.value.expression) ||
		t.isNumericLiteral(node.value.expression)
	) {
		return String(node.value.expression.value)
	}

	return String(node.value.value)
}

/** Creates a `jSXAttribute` */
export function createAttribute(name, value) {
	return t.jSXAttribute(t.jSXIdentifier(name), t.stringLiteral(value))
}

/** Escapes `"` */
const escapeAttribute = (() => {
	const chars = {
		"'": '&#39;',
		'"': '&quot;',
	}

	const search = /['"]/g
	const replace = c => chars[c]

	return function (s) {
		return s.replace(search, replace)
	}
})()
