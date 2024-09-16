import core, { types as t } from '@babel/core'

import {
	callFunction,
	callFunctionImport,
	keys,
	removeFromArray,
} from './utils.js'

import {
	buildAttributeIntoTag,
	createAttribute,
	getAttributeLiteral,
	isAttributeLiteral,
} from './attributes.js'
import { isVoidElement, validateChildrenHTML } from './html.js'
import { merge, mergeToTag } from './merge.js'
import { buildProps } from './props.js'
import { getTagName } from './tag.js'
import { validatePartial } from './validate.js'

/** Builds partial from jsx */
export function buildPartial(path, state) {
	// tag

	const tagName = getTagName(path)

	// open opening tag

	const tag = { tagName, content: `<${tagName}`, props: [] }

	// state

	let isXML = false
	let isCustomElement = tagName.includes('-')
	let isImportNode = isCustomElement
	let xmlns = ''

	// attributes

	/**
	 * `#pota` default attribute/prop makes sure every single tag has
	 * props, so that way we can map props to specific nodes. We remove
	 * the prop at compile time.
	 */

	const attributes = [createAttribute('#pota', '')]

	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
			const name = attr.node.name.name

			isCustomElement = isCustomElement || name === 'is'

			isImportNode =
				isImportNode ||
				// Firefox needs `importNode` for images/iframes with loading="lazy"
				((tagName === 'img' || tagName === 'iframe') &&
					name === 'loading')

			if (name === 'xmlns') {
				isXML = true
			}

			if (isAttributeLiteral(attr.node)) {
				if (name === 'xmlns') {
					xmlns = getAttributeLiteral(attr.node)
					/**
					 * Skip inlining the `xmlns` attribute in the tag when its a
					 * literal
					 */
					continue
				}

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
				isXML = true
				xmlns = 'http://www.w3.org/2000/svg'
				break
			}
			case 'math': {
				isXML = true
				xmlns = 'http://www.w3.org/1998/Math/MathML'
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

	tag.props.unshift(buildProps(attributes, children))

	// close tag

	if (!isVoidElement(tagName)) {
		tag.content += `</${tagName}>`
	}

	// call

	const partial = callFunctionImport(state, 'createPartial', [
		t.stringLiteral(tag.content),
		t.arrayExpression(tag.props),
	])
	partial.isPartial = true

	partial.isXML = isXML
	partial.xmlns = xmlns
	partial.isImportNode = isImportNode
	partial.isCustomElement = isCustomElement

	/**
	 * Used to display an error when children cannot be nested because
	 * the hierarchy of tags is invalid and template cloning will yield
	 * results that do not match the desired template
	 */
	partial.tagName = tagName
	partial._path = path

	return partial
}

/** Hoist and merge partials */
export function partialMerge(path, state) {
	const node = path.node

	// create map of props -> nodes, and removes #pota prop
	const elements = node.arguments[1].elements

	const propsAt = {}
	const elementData = {}

	let propsKey = 0
	const toRemove = []

	for (let i = 0; i < elements.length; i++) {
		const properties = elements[i].properties

		// #find the #pota prop and remove it
		const potaProp = properties.find(
			value => value.key.value === '#pota',
		)
		if (potaProp) {
			removeFromArray(properties, potaProp)
		}

		// if there are other props than #pota then this element has props at
		if (properties.length) {
			// do not add the obvious propKeys to make output smaller
			if (propsKey !== i) {
				propsAt[propsKey] = i
			}
			propsKey++
		} else {
			// props object is empty
			toRemove.push(elements[i])
		}
	}

	// save the max number of nodes to walk
	if (propsAt[propsKey - 1] > -1) {
		elementData.m = propsAt[propsKey - 1] + 1
	}

	// remove empty props objects from array
	for (const remove of toRemove) {
		removeFromArray(elements, remove)
	}

	// remove empty array of props from partial function
	if (node.arguments[1].elements.length === 0) {
		removeFromArray(node.arguments, node.arguments[1])
	}

	// hoist it

	const partial = getPartialLiteral(node)

	// scope

	const scope = path.scope.getProgramParent()

	scope.pota = scope.pota || {
		partials: {},
		components: {},
		files: {},
	}

	const pota = scope.pota

	// de-duplicates and hoist calls to partials

	if (!pota.partials[partial]) {
		validatePartial(path, partial)

		// identifier

		pota.partials[partial] = scope.generateUidIdentifier(node.tagName)

		// args

		const args = [node.arguments[0]]

		if (node.xmlns) {
			elementData.x = node.xmlns
		}

		// if should use importNode instead of cloneNode

		if (node.isCustomElement) {
			elementData.c = 1
		}
		if (node.isImportNode) {
			elementData.i = 1
		}

		// push arguments

		if (keys(propsAt).length) {
			args.push(
				core.template.expression.ast`${JSON.stringify(propsAt)}`,
			)
		} else {
			if (keys(elementData).length) {
				args.push(t.objectExpression([]))
			}
		}

		if (keys(elementData).length) {
			args.push(
				core.template.expression.ast`${JSON.stringify(elementData)}`,
			)
		}

		// call

		scope.push({
			id: pota.partials[partial],
			init: callFunctionImport(state, 'createPartial', args),
		})
	}

	return callFunction(
		pota.partials[partial].name,
		node.arguments[1] ? [node.arguments[1]] : [],
	)
}

/**
 * Returns `true` when `node` is `partial` and not `XML`, not a
 * `custom element`
 */
export function canMergePartials(node) {
	return (
		node.isPartial &&
		!node.isXML &&
		!node.isImportNode &&
		!node.isCustomElement
	)
}

/** Returns `true` when `node` is partial */
export function isPartial(node) {
	return node.isPartial
}

/** Returns partial as `string` */
export function getPartialLiteral(node) {
	return node.arguments[0].value
}
