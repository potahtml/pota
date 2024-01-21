import { $internal } from '../constants.js'
import {
	signal,
	effect,
	batch,
} from '../lib/reactivity/primitives/solid.js'
import { empty } from '../lib/std/empty.js'
import { entries } from '../lib/std/entries.js'
import { flat } from '../lib/std/flat.js'
import { getValue } from '../lib/std/getValue.js'
import { optional } from '../lib/std/optional.js'
import { toArray } from '../lib/std/toArray.js'

import { Component, createElement, toHTML } from './@renderer.js'

/**
 * Function to create tagged template components
 *
 * @param {object} [options]
 * @param {boolean} [options.wrap] - Wrap the return value in a
 *   function for playing nicely with context and reactivity. Defaults
 *   to `true`
 * @returns {Function & { define: ({}) => void }}
 */
export function HTML(options = empty()) {
	const components = empty()
	/**
	 * Creates tagged template components
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...any} values
	 * @returns {Children}
	 */
	function html(template, ...values) {
		let cached = HTML.cache.get(template)
		if (!cached) {
			cached = empty()
			cached.template = createElement('template')
			cached.template.innerHTML = template
				.join('<pota></pota>')
				.trim()
				/**
				 * Expand self-closing tags that don't contain attributes,
				 * because self-closing tags with innerHTML won't work.
				 */
				.replace(/<([-a-z]+)\s*\/\s*>/gi, '<$1></$1>')
				// un-expand brs because it causes double lines
				.replaceAll('<br></br>', '<br/>')

			HTML.cache.set(template, cached)
		}

		const clone = cached.template.content.cloneNode(true)

		let index = 0
		function nodes(node) {
			const nodeType = node.nodeType
			if (nodeType === 9 || nodeType === 11) {
				// Node.DOCUMENT_NODE || Node.DOCUMENT_FRAGMENT_NODE
				return toArray(node.childNodes).map(nodes)
			} else if (nodeType === 1) {
				// Node.ELEMENT_NODE
				const tag = node.tagName
				if (tag === 'POTA') return values[index++]

				// gather props
				const props = empty()
				props.children = null
				for (const { name, value } of node.attributes)
					props[name] =
						value === '<pota></pota>' ? values[index++] : value

				// gather children
				/**
				 * `childNodes` should overwrite any children="" attribute but
				 * only if childNodes has something
				 */
				const length = node.childNodes.length
				if (length === 1) {
					/**
					 * When children is an array, as in >${[0, 1, 2]}< then
					 * children will end as `[[0,1,3]]`, so flat it
					 */
					props.children = nodes(node.childNodes[0])
				} else if (length) {
					props.children = []
					for (const child of node.childNodes)
						props.children.push(nodes(child))
				}

				// when it's a registered component use that instead
				const component = components[tag]

				// needs to return a function so reactivity works properly
				return Component(component || tag, props)
			} else {
				return node
			}
		}

		// flat to return a single element if possible to make it more easy to use
		const children = flat(nodes(clone))

		cached.result = optional(options.wrap)
			? children
			: toNodes(toHTML(children, $internal))

		return cached.result
	}

	html.define = userComponents => {
		for (const [name, component] of entries(userComponents)) {
			components[name.toUpperCase()] = component
		}
	}

	return html
}
HTML.cache = new WeakMap()

export const html = HTML({ wrap: false })

/**
 * Runs an `effect` on an `HTML` template. Reacts to values changes
 * even if values arent reactive. The effect receives `html` for
 * template creation.
 *
 * @param {(html) => any} fn - Function to run as an effect. It
 *   receives argument `html` for template creation.
 * @returns {Children}
 */
export const htmlEffect = fn => {
	const html = HTML()

	const _html = (template, ...values) => {
		// when template is cached just update the signals
		let cached = HTML.cache.get(template)
		if (cached) {
			// update signals with the new values
			const update = (template, values) => {
				batch(() => {
					for (let [key, value] of entries(values)) {
						cached.signals[key][1](getValue(value)) // read + write
					}
				})
			}
			update(template, values)

			return cached.result
		}

		// create signals with the initial values
		const signals = []

		const valuesToSignals = values.map((value, key) => {
			signals[key] = signal(getValue(value))
			return signals[key][0] // read
		})

		// create html
		const result = html(template, ...valuesToSignals)

		// save signals
		cached = HTML.cache.get(template)
		cached.signals = signals

		// track reads + update signals whenever the values change
		effect(() => fn(_html))

		// return result
		return result
	}

	return fn(_html)
}

/**
 * DocumentFragment is transformed to an array of nodes, that way we
 * can keep a reference to them. Because using the DocumentFragment
 * will remove the nodes from the DocumentFragment.
 */
const toNodes = nodes =>
	nodes instanceof DocumentFragment
		? toArray(nodes.childNodes)
		: nodes
