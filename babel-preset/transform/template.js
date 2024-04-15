import { types as t } from '@babel/core'

import { call, getHTMLTagName, isVoidElement } from './utils.js'

import {
	buildProps,
	createLiteralAttribute,
	getAttributeLiteral,
	isAttributeLiteral,
} from './attributes.js'

import {
	mergeAttributeToTag,
	mergeChildrenToTag,
	mergeTemplates,
	mergeText,
	mergeTextToTemplate,
} from './merge.js'

export function buildHTMLTemplate(path, file) {
	// tag

	const tagName = getHTMLTagName(path)

	// open opening tag

	const tag = { content: `<${tagName}` }

	// attributes

	const attributes = []

	let hasXMLNS = false
	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
			const name = attr.node.name.name

			if (name === 'xmlns') {
				hasXMLNS = true
			}

			// skip `xmlns` so it builds the template with the right namespace
			if (name !== 'xmlns' && isAttributeLiteral(attr.node)) {
				const value = getAttributeLiteral(attr.node)

				mergeAttributeToTag(tag, name, value)

				continue
			}
		}
		attributes.push(attr)
	}

	// add xmlns attribute when missing
	if (!hasXMLNS) {
		switch (tagName) {
			case 'svg': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/2000/svg',
					),
				)
				break
			}
			case 'math': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/1998/Math/MathML',
					),
				)
				break
			}
			case 'foreignObject': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/1999/xhtml',
					),
				)
				break
			}
		}
	}

	// close opening tag

	if (isVoidElement(tagName)) {
		// it needs a space after the last attribute for unquoted attributes
		// <link href=http://somepath.css/>
		// browser will load `href=http://somepath.css/` instead of `http://somepath.css`
		tag.content += ` />`
	} else {
		tag.content += `>`
	}

	// children

	let children = t.react.buildChildren(path.node)

	children = mergeChildrenToTag(children, tag)
	children = mergeText(children)
	children = mergeTemplates(children)
	children = mergeTextToTemplate(children)

	// close tag

	if (!isVoidElement(tagName)) {
		tag.content += `</${tagName}>`
	}

	const args = [t.stringLiteral(tag.content)]

	// props

	const props = buildProps(attributes, children)

	if (props) {
		args.push(props)
	}

	// call

	return call(file, 'template', args)
}

// template

export function isHTMLTemplate(node) {
	return (
		t.isCallExpression(node) &&
		node.arguments.length === 1 &&
		node.arguments[0].type === 'StringLiteral' &&
		node.callee?.name === '_template'
	)
}
export function getHTMLTemplate(node) {
	return node.arguments[0].value
}
