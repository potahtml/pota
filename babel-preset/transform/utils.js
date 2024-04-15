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
