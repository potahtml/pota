import core, { types as t } from '@babel/core'

import { call } from './utils.js'

import {
	buildAttributeIntoTag,
	createLiteralAttribute,
	getAttributeLiteral,
	isAttributeLiteral,
} from './attributes.js'
import { merge, mergeToTag } from './merge.js'
import { buildProps } from './props.js'
import {
	getHTMLTagName,
	isVoidElement,
	validateChildrenHTML,
} from './html.js'

export function buildHTMLTemplate(path, state) {
	let isXML = false

	// tag

	const tagName = getHTMLTagName(path)

	// open opening tag

	const tag = { tagName, content: `<${tagName} pota`, props: [] }

	// attributes

	const attributes = []
	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
			const name = attr.node.name.name

			if (name === 'xmlns') {
				isXML = true
			}

			/**
			 * Skip inlining the `xmlns` attribute in the tag, so it builds
			 * the template with the right namespace without merging this
			 * template with others
			 */
			if (name !== 'xmlns' && isAttributeLiteral(attr.node)) {
				const value = getAttributeLiteral(attr.node)

				buildAttributeIntoTag(tag, name, value)

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

	validateChildrenHTML(tag.tagName, children)

	children = mergeToTag(children, tag)
	children = merge(children)

	// props

	const props = buildProps(attributes, children)

	if (props) {
		tag.props.unshift(props)
	} else {
		/** Remove placeholder when it doesnt have props. */
		tag.content = tag.content.replace(/^<([^\s]+) pota/, '<$1')
	}

	// close tag

	if (!isVoidElement(tagName)) {
		tag.content += `</${tagName}>`
	}

	// call

	const template = call(state, 'template', [
		t.stringLiteral(tag.content),
		t.arrayExpression(tag.props),
	])
	template.isXML = isXML
	template.isTemplate = true
	template.tagName = tagName
	template._path = path

	return template
	return core.template.expression.ast`() => ${template}`
}

export function isHTMLTemplate(node) {
	return node.isTemplate && !node.isXML
}
export function getHTMLTemplate(node) {
	return node.arguments[0].value
}
