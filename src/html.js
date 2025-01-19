import {
	batch,
	cleanup,
	root,
	signal,
	syncEffect,
} from './lib/reactive.js'

import {
	createComment,
	createTextNode,
	empty,
	error,
	flat,
	getValue,
	toArray,
	warn,
	withWeakCache,
} from './lib/std.js'

import { Component } from './renderer.js'

import {
	A,
	Collapse,
	Dynamic,
	For,
	Head,
	Match,
	Portal,
	Router,
	Show,
	Switch,
} from './web/@main.js'

const defaultRegistry = {
	A,
	Collapse,
	Dynamic,
	For,
	Head,
	Match,
	Portal,
	Router,
	Show,
	Switch,
}

// parseHTML

const id = 'pota19611227'
const splitId = /(pota19611227)/

const xmlns = [
	'class',
	'on',
	'prop',
	'attr',
	'bool',
	'style',
	'var',
	'onMount',
	'onUnmount',
	'ref',
]
	.map(ns => `xmlns:${ns}="/"`)
	.join(' ')

/**
 * Makes Nodes from TemplateStringsArray
 *
 * @param {TemplateStringsArray} content
 * @returns {Element}
 */
const parseHTML = withWeakCache(content => {
	const html = new DOMParser().parseFromString(
		`<xml ${xmlns}>${content.join(id)}</xml>`,
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
 * @param {{ components: {} }} html
 * @param {Element[]} cached
 * @param {...any} values
 * @returns {Children}
 */
function toH(html, cached, values) {
	let index = 0
	function nodes(node) {
		if (node.nodeType === 1) {
			// element
			const tagName = node.tagName

			// gather props
			const props = empty()
			for (let { name, value } of node.attributes) {
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
			const childNodes = node.childNodes
			if (childNodes.length) {
				props.children = flat(toArray(childNodes).map(nodes))
			}

			;/[A-Z]/.test(tagName) &&
				!html.components[tagName] &&
				warn(`html: Forgot to ´html.define({ ${tagName} })´?`)

			return Component(html.components[tagName] || tagName, props)
		} else if (node.nodeType === 3) {
			// text
			const value = node.nodeValue
			return value.includes(id)
				? value
						.split(splitId)
						.map(x => (x === id ? values[index++] : x))
				: value
		} else if (node.nodeType === 8) {
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
			error(`html: ´nodeType´ not supported ´${node.nodeType}´`)
		}
	}

	return flat(toArray(cached).map(nodes))
}

/**
 * Function to create cached tagged template components
 *
 * @returns {Function & {
 * 	define: ({ components }) => void
 * 	components: {}
 * }}
 * @url https://pota.quack.uy/HTML
 */

export function HTML() {
	/**
	 * Creates tagged template components
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...any} values
	 * @returns {Children}
	 * @url https://pota.quack.uy/HTML
	 */

	function html(template, ...values) {
		return toH(html, parseHTML(template), values)
	}

	html.components = { ...defaultRegistry }
	html.define = userComponents => {
		for (const name in userComponents) {
			html.components[name] = userComponents[name]
		}
	}

	return html
}

export const html = HTML()
