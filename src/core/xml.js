import {
	assign,
	empty,
	error,
	keys,
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
	Errored,
	For,
	Head,
	Match,
	Navigate,
	Normalize,
	Portal,
	Range,
	Route,
	Show,
	Suspense,
	Switch,
	Tabs,
} from '../components/@main.js'
import { createComment, createTextNode } from '../use/dom.js'

/** @type {Record<string, JSX.ElementType>} */
const defaultRegistry = assign(empty(), {
	A,
	Collapse,
	Dynamic,
	Errored,
	For,
	Head,
	Match,
	Navigate,
	Normalize,
	Portal,
	Range,
	Route,
	Show,
	Suspense,
	Switch,
	Tabs,
})

// parseXML

const id = 'rosa19611227'
const splitId = /(rosa19611227)/

/**
 * Makes Nodes from TemplateStringsArray
 *
 * @param {TemplateStringsArray} content
 * @returns {NodeListOf<ChildNode>}
 */
const parseXML = withWeakCache(
	(/** @type TemplateStringsArray */ content) => {
		const html = /** @type {NodeListOf<ChildNode>} */ (
			new DOMParser().parseFromString(
				`<xml ${namespaces.xmlns}>${content.join(id)}</xml>`,
				'text/xml',
			).firstChild.childNodes
		)

		const first = /** @type {HTMLElement} */ (html[0])
		if (first?.tagName === 'parsererror') {
			first.style.padding = '1em'
			first.style.whiteSpace = 'pre-line'
			first.innerText =
				first.childNodes[1].textContent + '\n' + content.join('$v')
		}
		return html
	},
)

/**
 * Recursively walks a template and transforms it to `h` calls.
 *
 * @param {typeof xml} xml
 * @param {NodeListOf<ChildNode>} cached
 * @param {...unknown} values
 * @returns {JSX.Element}
 */
function toH(xml, cached, values) {
	let index = 0
	/**
	 * Recursively transforms DOM nodes into Component calls.
	 *
	 * @param {ChildNode} node
	 * @returns {JSX.Element}
	 */
	function nodes(node) {
		const { nodeType } = node
		if (nodeType === 1) {
			// element
			const { tagName, attributes, childNodes } =
				/** @type {DOMElement} */ (node)

			// gather props
			/** @type {Record<string, unknown>} */
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

			const component = xml.components[tagName]

			if (!component && /^[A-Z]/.test(tagName)) {
				warn(`xml: Forgot to ´xml.define({ ${tagName} })´?`)
			}

			return Component(component || tagName, props)
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
				// reuse one Comment node and mutate its nodeValue so
				// reactive updates don't replace the node on every read
				const comment = createComment('')
				return () => {
					comment.nodeValue = val.map(getValue).join('')
					return comment
				}
			} else {
				return createComment(value)
			}
		} else {
			error(`xml: ´nodeType´ not supported ´${nodeType}´`)
			return null
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
 * ) => JSX.Element) & {
 * 	components: Record<string, JSX.ElementType>
 * 	define: (userComponents: Record<string, JSX.ElementType>) => void
 * }}
 * @url https://pota.quack.uy/XML
 */
export function XML() {
	/**
	 * Creates tagged template components.
	 *
	 * Templates are parsed as `text/xml`, so elements must be
	 * well-formed: void elements need a trailing slash (`<br/>`, `<img
	 * src=""/>`), every open tag must be closed, and attribute values
	 * must be quoted. Ill-formed input renders a `parsererror` element
	 * instead of throwing.
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...unknown} values
	 * @url https://pota.quack.uy/XML
	 */
	function xml(template, ...values) {
		return toH(xml, parseXML(template), values)
	}

	xml.components = assign(empty(), defaultRegistry)
	/**
	 * Registers custom components that can be referenced by tag name.
	 *
	 * @param {Record<string, JSX.ElementType>} userComponents
	 */
	xml.define = userComponents => {
		for (const name of keys(userComponents)) {
			xml.components[name] = userComponents[name]
		}
	}

	return xml
}

export const xml = XML()
