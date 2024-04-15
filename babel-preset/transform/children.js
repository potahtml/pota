import { types as t } from '@babel/core'

import { escapeHTML } from './utils.js'

export function buildChildrenProperty(children) {
	let childrenNode
	if (children.length === 1) {
		childrenNode = children[0]
	} else if (children.length > 1) {
		childrenNode = t.arrayExpression(children)
	} else {
		return undefined
	}
	return t.objectProperty(t.identifier('children'), childrenNode)
}

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
