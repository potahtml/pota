import { types as t } from '@babel/core'

export const get = (pass, name) =>
	pass.get(`@babel/plugin-react-jsx/${name}`)

export const set = (pass, name, v) =>
	pass.set(`@babel/plugin-react-jsx/${name}`, v)

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

	return function escape(s) {
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

	return function escape(s) {
		return s.replace(search, replace)
	}
})()

export function isVoidElement(tagName) {
	switch (tagName.toLowerCase()) {
		case 'area':
		case 'base':
		case 'br':
		case 'col':
		case 'embed':
		case 'hr':
		case 'img':
		case 'input':
		case 'link':
		case 'meta':
		case 'param':
		case 'source':
		case 'track':
		case 'wbr': {
			return true
		}
		default: {
			return false
		}
	}
}

export function call(pass, name, args) {
	return t.callExpression(get(pass, `id/${name}`)(), args)
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

export function isHTMLTag(path) {
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
		return tagName
	} else {
		return false
	}
}

export function getHTMLTagName(path) {
	return isHTMLTag(path)
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

// clean children from unused extra

export function clearEmptyExtra(children) {
	const toDeleteChild = []
	for (const child of children) {
		if (child.properties) {
			const toDelete = []
			for (const obj of child.properties) {
				if (obj.key.name === 'children') {
					clearEmptyExtra(obj.value.elements)
				}
				if (obj.key.name === 'sibling') {
					clearEmptyExtra(obj.value.elements)
				}
				if (
					obj.key.name === 'children' &&
					obj.value.elements.length === 0
				) {
					toDelete.push(obj)
				}
				if (
					obj.key.name === 'sibling' &&
					obj.value.elements.length === 0
				) {
					toDelete.push(obj)
				}
			}
			for (const obj of toDelete) {
				removeFromArray(child.properties, obj)
			}

			if (child.properties.length === 0) {
				toDeleteChild.push(child)
			}
		}
	}
	for (const obj of toDeleteChild) {
		removeFromArray(children, obj)
	}
}

export function clearEmptyExtraChilden(children) {
	for (const child of children) {
		if (child.isTemplate) {
			clearEmptyExtra([child.arguments[1]])
			if (child.arguments[1].properties.length === 0) {
				removeFromArray(child.arguments, child.arguments[1])
			}
		}
	}
}
