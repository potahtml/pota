import { types as t } from '@babel/core'

import {
	callFunction,
	callFunctionImport,
	removeFromArray,
} from './utils.js'

import {
	buildAttributeIntoTag,
	createAttribute,
	getAttributeLiteral,
	isAttributeLiteral,
} from './attributes.js'
import { merge, mergeToTag } from './merge.js'
import { buildProps } from './props.js'
import { isVoidElement, validateChildrenHTML } from './html.js'
import { getTagName } from './tag.js'

/** Builds partial from jsx */
export function buildPartial(path, state) {
	let isXML = false

	// tag

	const tagName = getTagName(path)

	// custom element

	let isCustomElement = tagName.includes('-')

	// open opening tag

	const tag = { tagName, content: `<${tagName} pota`, props: [] }

	// attributes

	const attributes = []
	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
			const name = attr.node.name.name

			isCustomElement = isCustomElement || name === 'is'

			if (name === 'xmlns') {
				isXML = true
			}

			/**
			 * Skip inlining the `xmlns` attribute in the tag, so it builds
			 * the partial with the right namespace without merging this
			 * partial with others
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
					createAttribute('xmlns', 'http://www.w3.org/2000/svg'),
				)
				isXML = true
				break
			}
			case 'math': {
				attributes.push(
					createAttribute(
						'xmlns',
						'http://www.w3.org/1998/Math/MathML',
					),
				)
				isXML = true
				break
			}
			case 'foreignObject': {
				attributes.push(
					createAttribute('xmlns', 'http://www.w3.org/1999/xhtml'),
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

	const partial = callFunctionImport(
		state,
		isCustomElement ? 'createPartialCustomElement' : 'createPartial',
		[t.stringLiteral(tag.content), t.arrayExpression(tag.props)],
	)
	partial.isXML = isXML
	partial.isCustomElement = isCustomElement
	partial.isPartial = true
	partial.tagName = tagName
	/**
	 * To know the `path` to display an error when children cannot be
	 * nested
	 */
	partial._path = path

	return partial
}

/** Hoist and merge partials */
export function partialMerge(path, state) {
	// remove empty argument from partial function
	if (path.node.arguments[1].elements.length === 0) {
		removeFromArray(path.node.arguments, path.node.arguments[1])
	}

	// hoist it

	const partial = getPartialLiteral(path.node)

	// scope

	const scope = path.scope.getProgramParent()

	scope.pota = scope.pota || {
		partials: {},
		components: {},
		files: {},
	}

	const pota = scope.pota

	if (!pota.partials[partial]) {
		// identifier

		pota.partials[partial] = scope.generateUidIdentifier('_partial')

		// args

		const args = [path.node.arguments[0]]

		// xmlns

		const xmlns = !path.node.arguments[1]
			? undefined
			: path.node.arguments[1].elements[0].properties.find(
					property => property?.key?.name === 'xmlns',
				)?.value?.value

		if (xmlns) {
			args.push(t.stringLiteral(xmlns))
		}

		// call

		scope.push({
			id: pota.partials[partial],
			init: callFunctionImport(
				state,
				path.node.isCustomElement
					? 'createPartialCustomElement'
					: 'createPartial',
				args,
			),
		})
	}

	return callFunction(
		pota.partials[partial].name,
		path.node.arguments[1] ? [path.node.arguments[1]] : [],
	)
}

/**
 * Returns `true` when `node` is `partial` and not `XML`, not a
 * `custom element`
 */
export function isPartialHTML(node) {
	return node.isPartial && !node.isXML && !node.isCustomElement
}

/** Returns `true` when `node` is partial */
export function isPartial(node) {
	return node.isPartial
}

/** Returns partial as `string` */
export function getPartialLiteral(node) {
	return node.arguments[0].value
}
