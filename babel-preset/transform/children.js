import { types as t } from '@babel/core'

import { escapeHTML } from './utils.js'

export function isChildrenLiteral(node) {
	return (
		t.isStringLiteral(node) ||
		t.isNumericLiteral(node) ||
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression)
	)
}
export function getChildrenLiteral(node) {
	if (
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression)
	) {
		return escapeHTML(node.value?.expression.value)
	}
	return escapeHTML(node.value)
}
