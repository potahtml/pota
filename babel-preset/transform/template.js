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
	let isXML = false

	// tag

	const tagName = getHTMLTagName(path)

	// open opening tag

	const tag = { content: `<${tagName}`, children: [], sibling: [] }

	// attributes

	const attributes = []
	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
			const name = attr.node.name.name

			if (name === 'xmlns') {
				isXML = true
			}

			/**
			 * Skip inlining `xmlns` attribute so it builds the template
			 * with the right namespace
			 */
			if (name !== 'xmlns' && isAttributeLiteral(attr.node)) {
				const value = getAttributeLiteral(attr.node)

				mergeAttributeToTag(tag, name, value)

				continue
			}
		}
		attributes.push(attr)
	}

	// add xmlns attribute when missing

	if (!isXML) {
		switch (tagName) {
			case 'svg': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/2000/svg',
					),
				)
				isXML = true
				break
			}
			case 'math': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/1998/Math/MathML',
					),
				)
				isXML = true
				break
			}
			case 'foreignObject': {
				attributes.push(
					createLiteralAttribute(
						'xmlns',
						'http://www.w3.org/1999/xhtml',
					),
				)
				isXML = true
				break
			}
		}
	}

	// close opening tag

	if (isVoidElement(tagName)) {
		/**
		 * It needs a space after the last attribute for unquoted
		 * attributes `<link href=http://somepath.css/>`, the browser will
		 * load `href=http://somepath.css/` instead of
		 * `http://somepath.css`
		 */
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

	// call arguments

	const args = []

	args.push(t.stringLiteral(tag.content))

	// props

	const props = buildProps(attributes, children)

	// extra

	const extra = [
		t.objectProperty(
			t.identifier('children'),
			t.arrayExpression(tag.children),
		),
		t.objectProperty(
			t.identifier('sibling'),
			t.arrayExpression(tag.sibling),
		),
	]
	if (props) {
		extra.push(t.objectProperty(t.identifier('props'), props))
	}

	args.push(t.objectExpression(extra))

	// call
	const template = call(file, 'template', args)
	template.isXML = isXML
	template.isTemplate = true
	return template
}

// template

export function isHTMLTemplate(node) {
	return node.isTemplate && !node.isXML
}
export function getHTMLTemplate(node) {
	return node.arguments[0].value
}
