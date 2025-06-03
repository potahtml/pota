import { types as t } from '@babel/core'

/** Builds props */
export function buildProps(attributes, children) {
	const props = attributes.reduce(accumulate, [])
	if (children && children.length > 0) {
		props.push(buildPropChildren(children))
	}
	if (props.length) {
		return t.objectExpression(propsSort(props))
	}
}

/** Builds children prop */
export function buildPropChildren(children) {
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

function propsSort(props) {
	if (props) {
		props.sort((a, b) => {
			return a.key?.name === 'children'
				? 2
				: a.key?.name?.localeCompare(b.key?.name)
		})
	}
	return props
}

export function accumulate(array, attribute) {
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

function convertAttributeValue(node) {
	if (t.isJSXExpressionContainer(node)) {
		return node.expression
	} else {
		return node
	}
}

const hasProto = node =>
	node.properties.some(
		value =>
			t.isObjectProperty(value, {
				computed: false,
				shorthand: false,
			}) &&
			(t.isIdentifier(value.key, {
				name: '__proto__',
			}) ||
				t.isStringLiteral(value.key, {
					value: '__proto__',
				})),
	)
