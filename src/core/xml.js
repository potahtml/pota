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
	Switch,
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
	Switch,
}

// parseXML

const id = 'rosa19611227'
const splitId = /(rosa19611227)/

/**
 * Makes Nodes from TemplateStringsArray
 *
 * @param {TemplateStringsArray} content
 * @returns {Element[]}
 */
const parseXML = withWeakCache(content => {
	const html = new DOMParser().parseFromString(
		`<xml ${namespaces.xmlns}>${content.join(id)}</xml>`,
		'text/xml',
	).firstChild.childNodes

	if (html[0].tagName === 'parsererror') {
		const err = html[0]
		err.style.padding = '1em'
		err.firstChild.textContent = 'HTML Syntax Error:'
		err.firstChild.nextSibling.style.cssText = ''
		err.lastChild.replaceWith(createTextNode(content))
	}
	return html
})

/**
 * Recursively walks a template and transforms it to `h` calls
 *
 * @param {typeof xml} xml
 * @param {Element[]} cached
 * @param {...unknown} values
 * @returns {Children}
 */
function toH(xml, cached, values) {
	let index = 0
	/**
	 * Recursively transforms DOM nodes into Component calls
	 *
	 * @param {ChildNode} node - The DOM node to transform
	 * @param {ChildNode} node
	 * @returns {Children} Transformed node(s) as Components
	 */
	function nodes(node) {
		const { nodeType } = node
		if (nodeType === 1) {
			// element
			const { tagName, attributes, childNodes } =
				/** @type {Element} */ (node)

			// gather props
			/** @type {Record<string, Accessor<unknown>>} */
			const props = empty()
			for (let { name, value } of attributes) {
				if (value === id) {
					value = values[index++]
				} else if (value.includes(id)) {
					const val = value
						.split(splitId)
						.map(x => (x === id ? values[index++] : x))

					value = () => val.map(getValue).join('')
				}
				props[name] = value
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
 * Function to create cached tagged template components
 *
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
	/** @param {Record<string, Component>} userComponents */
	xml.define = userComponents => {
		for (const name in userComponents) {
			xml.components[name] = userComponents[name]
		}
	}

	return xml
}

export const xml = XML()
