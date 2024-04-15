import { types as t } from '@babel/core'

import { escapeAttribute, hasProto } from './utils.js'

import { buildChildrenProperty } from './children.js'

export function createLiteralAttribute(name, value) {
	return t.jSXAttribute(t.jSXIdentifier(name), t.stringLiteral(value))
}

export function buildProps(attribs, children) {
	const props = attribs.reduce(accumulateAttribute, [])
	if (children && children.length > 0) {
		props.push(buildChildrenProperty(children))
	}
	if (props.length) {
		return t.objectExpression(props)
	}
}

export function accumulateAttribute(array, attribute) {
	// when we create an attribute manually, is not attached to a node yet
	attribute = 'node' in attribute ? attribute.node : attribute

	if (t.isJSXSpreadAttribute(attribute)) {
		const arg = attribute.argument
		if (t.isObjectExpression(arg) && !hasProto(arg)) {
			array.push(...arg.properties)
		} else {
			array.push(t.spreadElement(arg))
		}
		return array
	}

	const value = convertAttributeValue(
		attribute.value || t.booleanLiteral(true),
	)

	if (
		t.isStringLiteral(value) &&
		!t.isJSXExpressionContainer(attribute.value)
	) {
		var _value$extra
		value.value = value.value.replace(/\n\s+/g, ' ')
		// mind to write stuff that could be read?
		;(_value$extra = value.extra) == null || delete _value$extra.raw
	}

	if (t.isJSXNamespacedName(attribute.name)) {
		attribute.name = t.stringLiteral(
			attribute.name.namespace.name + ':' + attribute.name.name.name,
		)
	} else if (t.isValidIdentifier(attribute.name.name, false)) {
		attribute.name.type = 'Identifier'
	} else {
		attribute.name = t.stringLiteral(attribute.name.name)
	}
	array.push(
		t.inherits(t.objectProperty(attribute.name, value), attribute),
	)
	return array
}

export function convertAttributeValue(node) {
	if (t.isJSXExpressionContainer(node)) {
		return node.expression
	} else {
		return node
	}
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
		return escapeAttribute(String(node.value.expression.value))
	}
	return escapeAttribute(String(node.value.value))
}
