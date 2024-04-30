import { types as t } from '@babel/core'

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

export const escapeAttribute = (() => {
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

/**
 * Removes a value from an array
 *
 * @param {any[]} array
 * @param {any} value To remove from the array
 * @returns {any[]}
 */
export function removeFromArray(array, value) {
	const index = array.indexOf(value)
	if (index !== -1) array.splice(index, 1)
	return array
}

export const get = (pass, name) =>
	pass.get(`@babel/plugin-pota-jsx/${name}`)

export const set = (pass, name, v) =>
	pass.set(`@babel/plugin-pota-jsx/${name}`, v)

export function call(pass, name, args) {
	return t.callExpression(get(pass, `id/${name}`)(), args)
}
export function importing(pass, name) {
	return get(pass, `id/${name}`)()
}

export function hasProto(node) {
	return node.properties.some(
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
}

export function getTag(path) {
	const openingPath = path.get('openingElement')

	const tagExpr = convertJSXIdentifier(
		openingPath.node.name,
		openingPath.node,
	)
	let tagName
	if (t.isIdentifier(tagExpr)) {
		tagName = tagExpr.name
	} else if (t.isStringLiteral(tagExpr)) {
		tagName = tagExpr.value
	}

	if (t.react.isCompatTag(tagName)) {
		return t.stringLiteral(tagName)
	} else {
		return tagExpr
	}
}

export function convertJSXIdentifier(node, parent) {
	if (t.isJSXIdentifier(node)) {
		if (node.name === 'this' && t.isReferenced(node, parent)) {
			return t.thisExpression()
		} else if (t.isValidIdentifier(node.name, false)) {
			node.type = 'Identifier'
			return node
		} else {
			return t.stringLiteral(node.name)
		}
	} else if (t.isJSXMemberExpression(node)) {
		return t.memberExpression(
			convertJSXIdentifier(node.object, node),
			convertJSXIdentifier(node.property, node),
		)
	} else if (t.isJSXNamespacedName(node)) {
		return t.stringLiteral(`${node.namespace.name}:${node.name.name}`)
	}
	return node
}

export function convertAttributeValue(node) {
	if (t.isJSXExpressionContainer(node)) {
		return node.expression
	} else {
		return node
	}
}
