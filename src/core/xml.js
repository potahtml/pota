import {
	empty,
	error,
	unwrapArray,
	getValue,
	toArray,
	warn,
	withWeakCache,
} from '../lib/std.js'

import { namespaces } from './props/plugin.js'

import { Component } from './renderer.js'

import {
	A,
	Collapse,
	Dynamic,
	For,
	Head,
	Match,
	Navigate,
	Portal,
	Range,
	Route,
	Show,
	Suspense,
	Switch,
	Tabs,
} from '../components/@main.js'
import { createComment, createTextNode } from '../use/dom.js'

/** @type {Record<string, Component>} */
const defaultRegistry = {
	A,
	Collapse,
	Dynamic,
	For,
	Head,
	Match,
	Navigate,
	Portal,
	Range,
	Route,
	Show,
	Suspense,
	Switch,
	Tabs,
}

// parseXML

const id = 'rosa19611227'
const splitId = /(rosa19611227)/

/**
 * Makes Nodes from TemplateStringsArray
 *
 * @param {TemplateStringsArray} content
 * @returns {DOMElement[]}
 */
const parseXML = withWeakCache(
	(/** @type TemplateStringsArray */ content) => {
		const html = /** @type {DOMElement[]} */ (
			/** @type unknown */ (
				new DOMParser().parseFromString(
					`<xml ${namespaces.xmlns}>${content.join(id)}</xml>`,
					'text/xml',
				).firstChild.childNodes
			)
		)

		if (html[0].tagName === 'parsererror') {
			const err = html[0]
			err.style.padding = '1em'
			err.firstChild.textContent = 'HTML Syntax Error:'
			// @ts-expect-error typescript doesnt understand dom walking
			err.firstChild.nextSibling.style.cssText = ''
			err.lastChild.replaceWith(createTextNode(content))
		}
		return html
	},
)

/**
 * Recursively walks a template and transforms it to `h` calls.
 *
 * @param {typeof xml} xml
 * @param {DOMElement[]} cached
 * @param {...unknown} values
 * @returns {Children}
 */
function toH(xml, cached, values) {
	let index = 0
	/**
	 * Recursively transforms DOM nodes into Component calls.
	 *
	 * @param {ChildNode} node
	 * @returns {Children}
	 */
	function nodes(node) {
		const { nodeType } = node
		if (nodeType === 1) {
			// element
			const { tagName, attributes, childNodes } =
				/** @type {DOMElement} */ (node)

			// gather props
			/** @type {Record<string, Accessor<unknown>>} */
			const props = empty()
			for (let { name, value } of attributes) {
				if (value === id) {
					props[name] = values[index++]
				} else if (value.includes(id)) {
					const val = value
						.split(splitId)
						.map(x => (x === id ? values[index++] : x))
					props[name] = () => val.map(getValue).join('')
				} else {
					props[name] = value
				}
			}

			// gather children
			if (childNodes.length) {
				props.children = unwrapArray(toArray(childNodes).map(nodes))
			}

			;/[A-Z]/.test(tagName) &&
				!xml.components[tagName] &&
				warn(`xml: Forgot to ´xml.define({ ${tagName} })´?`)

			return Component(xml.components[tagName] || tagName, props)
		} else if (nodeType === 3) {
			// text
			const value = node.nodeValue
			return value.includes(id)
				? value
						.split(splitId)
						.map(x => (x === id ? values[index++] : x))
				: value
		} else if (nodeType === 8) {
			// comment
			const value = node.nodeValue
			if (value.includes(id)) {
				const val = value
					.split(splitId)
					.map(x => (x === id ? values[index++] : x))
				return () => createComment(val.map(getValue).join(''))
			} else {
				return createComment(value)
			}
		} else {
			error(`xml: ´nodeType´ not supported ´${nodeType}´`)
		}
	}

	return unwrapArray(toArray(cached).map(nodes))
}

/**
 * Function to create cached tagged template components.
 *
 * @returns {((
 * 	template: TemplateStringsArray,
 * 	...values: unknown[]
 * ) => Children) & {
 * 	components: Record<string, Component>
 * 	define: (userComponents: Record<string, Component>) => void
 * }}
 * @url https://pota.quack.uy/XML
 */
export function XML() {
	/**
	 * Creates tagged template components
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...unknown} values
	 * @url https://pota.quack.uy/XML
	 */
	function xml(template, ...values) {
		return toH(xml, parseXML(template), values)
	}

	xml.components = { ...defaultRegistry }
	/**
	 * Registers custom components that can be referenced by tag name.
	 *
	 * @param {Record<string, Component>} userComponents
	 */
	xml.define = userComponents => {
		for (const name in userComponents) {
			xml.components[name] = userComponents[name]
		}
	}

	return xml
}

export const xml = XML()
