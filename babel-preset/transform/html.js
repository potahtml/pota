import { types as t } from '@babel/core'
import { isValidHTMLNesting } from 'validate-html-nesting'

import { convertJSXIdentifier } from './utils.js'

import { isHTMLTemplate } from './template.js'

const voidElements = new Set([
	'area',
	'base',
	'basefont',
	'bgsound',
	'br',
	'col',
	'command',
	'embed',
	'frame',
	'hr',
	'image',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
])
export function isVoidElement(tagName) {
	return voidElements.has(tagName.toLowerCase())
}

export function validateHTML(parent, child, node) {
	if (!isValidHTMLNesting(parent, child)) {
		throw node._path.buildCodeFrameError(
			`Invalid HTML: <${parent}> cannot be child of <${child}>`,
		)
	}
}
export function validateChildrenHTML(tagName, children) {
	for (const child of children) {
		if (isHTMLTemplate(child)) {
			validateHTML(tagName, child.tagName, child)
		}
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

	return t.react.isCompatTag(tagName) ? tagName : false
}

export function getHTMLTagName(path) {
	return isHTMLTag(path)
}
