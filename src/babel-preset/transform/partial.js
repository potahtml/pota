import * as core from '@babel/core'
const t = core.types

import {
	callFunction,
	callFunctionImport,
	error,
	hasStaticMarker,
	keys,
	removeFromArray,
} from './utils.js'

import {
	buildAttributeIntoTag,
	getAttributeLiteral,
	isAttributeLiteral,
	shouldSkipAttribute,
} from './attributes.js'
import { isVoidElement } from './html.js'
import { merge, mergeToTag } from './merge.js'
import { buildProps } from './props.js'
import { getTagName } from './tag.js'
import { validatePartial } from './validate.js'
import { buildChildrenPartial } from './children.js'

/** Builds partial from jsx */
export function buildPartial(path, state) {
	// tag

	const tagName = getTagName(path)

	// open opening tag

	const tag = { tagName, content: `<${tagName}`, props: [] }

	// state

	let isImportNode = tagName.includes('-')

	// state xml

	let xmlns = ''

	// add xmlns attribute when missing

	switch (tagName) {
		case 'svg':
		case 'foreignObject': {
			xmlns = 'http://www.w3.org/2000/svg'
			break
		}
		case 'math': {
			xmlns = 'http://www.w3.org/1998/Math/MathML'
			break
		}
	}

	// attributes

	const attributes = []

	// inlined function calls

	const inlinedNode = path.scope.generateUidIdentifier('node')

	const inlinedCalls = []
	function callInlined(fnName, ...args) {
		inlinedCalls.push(
			callFunctionImport(
				path,
				state,
				'pota',
				fnName,
				...args.map(x =>
					typeof x === 'string' ? t.stringLiteral(x) : x,
				),
			),
		)
	}
	function callInlinedFromJSXRuntime(fnName, ...args) {
		inlinedCalls.push(
			callFunctionImport(
				path,
				state,
				'pota/jsx-runtime',
				fnName,
				...args.map(x =>
					typeof x === 'string' ? t.stringLiteral(x) : x,
				),
			),
		)
	}

	// attributes

	for (const attr of path.get('openingElement').get('attributes')) {
		if (attr.isJSXAttribute()) {
			// no namespaced
			if (t.isJSXIdentifier(attr.node.name)) {
				const name = attr.node.name.name
				const value =
					(attr.node.value?.expression
						? attr.node.value.expression
						: attr.node.value) || t.booleanLiteral(true)

				// flags
				isImportNode =
					isImportNode ||
					name === 'is' ||
					(name === 'loading' &&
						(tagName === 'iframe' || tagName === 'img'))

				if (shouldSkipAttribute(value)) {
				} else if (isAttributeLiteral(value, attr)) {
					/** Inline attribute */
					if (name === 'xmlns') {
						xmlns = getAttributeLiteral(value, attr)
					} else {
						/** Inline the attribute */
						buildAttributeIntoTag(
							tag,
							name,
							getAttributeLiteral(value, attr),
						)
					}
				}
				// inlined calls
				else if (name === 'class') {
					callInlined('setClassList', inlinedNode, value)
				} else if (name === 'style') {
					callInlinedFromJSXRuntime('setStyle', inlinedNode, value)
				} else {
					// default to attributes
					if (hasStaticMarker(value)) {
						inlinedCalls.push(
							t.callExpression(
								t.memberExpression(
									inlinedNode,
									t.identifier('setAttribute'),
								),
								[t.stringLiteral(name), value],
							),
						)
					} else {
						callInlined('setAttribute', inlinedNode, name, value)
					}
				}
			} else if (t.isJSXNamespacedName(attr.node.name)) {
				// inlined namespaced
				const namespace = attr.node.name.namespace.name
				const localName = attr.node.name.name.name
				const name = namespace + ':' + localName

				const value =
					(attr.node.value?.expression
						? attr.node.value.expression
						: attr.node.value) || t.booleanLiteral(true)

				if (namespace === 'class') {
					callInlined('setClass', inlinedNode, localName, value)
				} else if (namespace === 'style') {
					callInlinedFromJSXRuntime(
						'setStyleNS',
						inlinedNode,
						localName,
						value,
					)
				} else if (namespace === 'on') {
					callInlinedFromJSXRuntime(
						'setEvent',
						inlinedNode,
						localName,
						value,
					)
				} else if (namespace === 'prop') {
					if (hasStaticMarker(value)) {
						inlinedCalls.push(
							t.assignmentExpression(
								'=',
								t.memberExpression(
									inlinedNode,
									t.identifier(localName),
								),
								value,
							),
						)
					} else {
						callInlined('setProperty', inlinedNode, localName, value)
					}
				} else if (name === 'use:ref') {
					inlinedCalls.push(t.callExpression(value, [inlinedNode]))
				} else if (name === 'use:css') {
					callInlinedFromJSXRuntime('setCSS', inlinedNode, value)
				} else if (name === 'use:connected') {
					callInlinedFromJSXRuntime(
						'setConnected',
						inlinedNode,
						value,
					)
				} else if (name === 'use:disconnected') {
					callInlinedFromJSXRuntime(
						'setDisconnected',
						inlinedNode,
						value,
					)
				} else if (
					namespace === 'xmlns' &&
					isAttributeLiteral(value, attr)
				) {
					buildAttributeIntoTag(
						tag,
						name,
						getAttributeLiteral(value, attr),
					)
				} else {
					// dynamic, could be a plugin
					callInlinedFromJSXRuntime(
						'assignPropNS',
						inlinedNode,
						name,
						value,
						localName,
						namespace,
					)
				}
			} else {
				// do not think this happens, but Im gonna leave it here just in case
				error(
					path,
					'unrecognized value for isJSXIdentifier attribute.',
					attr.node,
				)
			}
		} else if (t.isJSXSpreadAttribute(attr.node)) {
			// spread
			callInlinedFromJSXRuntime(
				'assignProps',
				inlinedNode,
				attr.node.argument,
			)
		} else {
			// do not think this happens, but Im gonna leave it here just in case
			error(path, 'unrecognized value for jsx attribute.', attr.node)
		}
	}

	// close opening tag

	if (isVoidElement(tagName)) {
		/**
		 * It needs a space after the last attribute for unquoted
		 * attributes `<link href=http://somepath.css/>`, the browser will
		 * load `http://somepath.css/` instead of `http://somepath.css`
		 */
		tag.content += ` />`
	} else {
		tag.content += `>`
	}

	// inline function calls

	/**
	 * Add a `#pota`prop to make sure every single `tag` has `props`, so
	 * that way we can map props to specific nodes. prop is rmoved at
	 * compile time.
	 */
	attributes.push(
		t.jSXAttribute(
			t.jSXIdentifier('#pota'),
			t.jSXExpressionContainer(
				t.arrowFunctionExpression(
					[inlinedNode],
					t.blockStatement(
						inlinedCalls.map(x => t.expressionStatement(x)),
					),
				),
			),
		),
	)

	// children

	let children = buildChildrenPartial(path)

	children = mergeToTag(children, tag)
	children = merge(children)

	// props

	tag.props.unshift(buildProps(attributes, children))

	// close tag

	if (!isVoidElement(tagName)) {
		tag.content += `</${tagName}>`
	}

	// call

	const partial = callFunctionImport(
		path,
		state,
		'pota/jsx-runtime',
		'createPartial',
		t.stringLiteral(tag.content),
		t.arrayExpression(tag.props),
	)
	partial.isPartial = true

	partial.xmlns = xmlns

	partial.tagName = tagName

	partial.isImportNode = isImportNode || tag.isImportNode

	return partial
}

/** Hoist and merge partials */
export function partialMerge(path, state) {
	const node = path.node

	// create map of props -> nodes, and inlines the function in place of the prop
	const elements = node.arguments[1].elements

	const propsAt = {}

	let propsKey = 0
	const toRemove = []

	for (let i = 0; i < elements.length; i++) {
		const properties = elements[i].properties

		// find #pota
		const potaProp = properties.find(
			value => value.key.value === '#pota',
		)

		// find children and append it to the #pota
		const childrenProp = properties.find(
			value => value.key.name === 'children',
		)

		if (childrenProp) {
			removeFromArray(properties, childrenProp)

			potaProp.value.body.body.push(
				callFunctionImport(
					path,
					state,
					'pota/jsx-runtime',
					'createChildren',
					potaProp.value.params[0],
					childrenProp.value,
				),
			)
		}

		if (!potaProp.value.body.body.length) {
			removeFromArray(properties, potaProp)
		}

		// if there are other props than #pota then this element has props at
		if (properties.length) {
			// do not add the obvious propKeys to make output smaller
			if (propsKey !== i) {
				propsAt[propsKey] = i
			}
			propsKey++

			elements[i] = potaProp.value
		} else {
			// props object is empty
			toRemove.push(elements[i])
		}
	}

	// save the max number of nodes to walk
	if (propsAt[propsKey - 1] > -1) {
		propsAt.m = propsAt[propsKey - 1] + 1
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

	// arguments matter for templates that look the same

	if (node.xmlns) {
		propsAt.x = node.xmlns
	}

	// if should use importNode instead of cloneNode

	if (node.isImportNode) {
		propsAt.i = 1
	}

	// props metadata - {"2":8,"3":10,"m":11,"i":1}

	const propsMetaData = JSON.stringify(propsAt)

	const partialID = partial + propsMetaData

	// de-duplicates and hoist calls to partials

	if (!pota.partials[partialID]) {
		validatePartial(path, partial)

		// identifier

		pota.partials[partialID] = scope.generateUidIdentifier(
			node.tagName,
		)

		// args

		const args = [node.arguments[0]]

		// push arguments

		if (keys(propsAt).length) {
			args.push(core.template.expression.ast`${propsMetaData}`)
		}

		// call

		scope.push({
			id: pota.partials[partialID],
			init: callFunctionImport(
				path,
				state,
				'pota/jsx-runtime',
				'createPartial',
				...args,
			),
		})
	}

	return callFunction(
		pota.partials[partialID].name,
		node.arguments[1] ? [node.arguments[1]] : [],
	)
}

/** Returns `true` when `node` is `partial` and not `XML` */
export function canMergePartials(node) {
	return node.isPartial && !node.xmlns
}

/** Returns `true` when `node` is partial */
export function isPartial(node) {
	return node.isPartial
}

/** Returns partial as `string` */
export function getPartialLiteral(node) {
	return node.arguments[0].value
}

/** Copies properties from `a` to `b` */
export function mergeProperties(b, a) {
	b.xmlns = b.xmlns || a.xmlns
	b.isImportNode = b.isImportNode || a.isImportNode
}
