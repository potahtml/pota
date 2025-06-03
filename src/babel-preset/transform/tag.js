import { types as t } from '@babel/core'

/** Gets identifier for tag */
export function getTagFunction(path) {
	const openingPath = path.get('openingElement')

	const tagExpr = convertJSXIdentifier(
		openingPath.node.name,
		openingPath.node,
	)

	return tagExpr
}

/** Gets identifier name for tag */
export function getTagFunctionName(path) {
	const openingPath = path.get('openingElement')

	const tagExpr = convertJSXIdentifier(
		openingPath.node.name,
		openingPath.node,
	)
	if (t.isIdentifier(tagExpr)) {
		return tagExpr.name
	} else if (t.isStringLiteral(tagExpr)) {
		return tagExpr.value
	} else if (t.isMemberExpression(tagExpr)) {
		return tagExpr.object.name + '.' + tagExpr.property.name
	} else {
		console.error(tagExpr)
		throw path.buildCodeFrameError(
			'Cannot figure out `tagName` for JSX function.',
		)
	}
}

/** Returns `tagName` for tag when tag is valid XHTML, or `false` */
export function isXHTMLTag(path) {
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

	return t.react.isCompatTag(tagName) ? tagName : ''
}

/** Returns `tagName` for tag when tag is valid XHTML, or `false` */
export { isXHTMLTag as getTagName }

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
