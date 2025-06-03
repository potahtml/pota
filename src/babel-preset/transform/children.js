import { types as t } from '@babel/core'

import { escapeHTML } from './html.js'
import { merge } from './merge.js'

/** Builds and merge children */
export function buildChildren(path) {
	return merge(t.react.buildChildren(path.node))
}

/** If children is string or number */
export function isChildrenLiteral(node) {
	return (
		t.isStringLiteral(node) ||
		t.isNumericLiteral(node) ||
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression)
	)
}

/** Gets children string or number */
export function getChildrenLiteral(node) {
	if (
		t.isStringLiteral(node.value?.expression) ||
		t.isNumericLiteral(node.value?.expression)
	) {
		return escapeHTML(node.value?.expression.value)
	}
	return escapeHTML(node.value)
}
