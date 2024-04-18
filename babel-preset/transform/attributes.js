import { types as t } from '@babel/core'

import { escapeAttribute } from './utils.js'

export function buildAttributeIntoTag(tag, name, value) {
	if (value.trim() === '') {
		tag.content += ' ' + name
		return
	}

	if (/"|'|=|<|>|`|\s/.test(value)) {
		tag.content += ' ' + name + "='" + escapeAttribute(value) + "'"
		return
	}

	tag.content += ' ' + name + '=' + escapeAttribute(value)
}

export function isAttributeLiteral(node) {
	return (
		t.isStringLiteral(node.value) ||
		t.isNumericLiteral(node.value) ||
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression)
	)
}
export function getAttributeLiteral(node) {
	if (
		t.isStringLiteral(node.value.expression) ||
		t.isNumericLiteral(node.value.expression)
	) {
		return String(node.value.expression.value)
	}
	return String(node.value.value)
}

export function createLiteralAttribute(name, value) {
	return t.jSXAttribute(t.jSXIdentifier(name), t.stringLiteral(value))
}
