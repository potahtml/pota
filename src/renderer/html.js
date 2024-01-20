import { $internal } from '../constants.js'
import {
	cleanup,
	signal,
} from '../lib/reactivity/primitives/solid.js'
import { empty } from '../lib/std/empty.js'
import { entries } from '../lib/std/entries.js'
import { flat } from '../lib/std/flat.js'
import { isFunction } from '../lib/std/isFunction.js'
import { optional } from '../lib/std/optional.js'
import { toArray } from '../lib/std/toArray.js'

import { create, createElement, toHTML } from './@renderer.js'

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
			cached = createElement('template')
			cached.innerHTML = template
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

		const clone = cached.content.cloneNode(true)

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
				return component
					? () => component(props)
					: () => create(tag)(props)
			} else {
				return node
			}
		}

		// flat to return a single element if possible to make it more easy to use
		const children = flat(nodes(clone))
		return optional(options.wrap)
			? children
			: toHTML(children, $internal)
	}

	html.define = userComponents => {
		for (const [name, component] of entries(userComponents)) {
			components[name.toUpperCase()] = create(component)
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
export const htmlEffect = (fn, options = empty()) => {
	const html = HTML({ wrap: false, ...options })
	const getValue = value => (isFunction(value) ? () => value : value)
	const signals = []

	let effect = (template, ...values) => {
		// html creation happens once, so just swap to signal setters
		effect = (template, ...values) => {
			for (const [key, value] of entries(values)) {
				signals[key][1](getValue(value))
			}
		}

		// create html and signals with the initial values
		return html(
			template,
			...values.map((value, key) => {
				signals[key] = signal(getValue(value))
				return signals[key][0]
			}),
		)
	}

	// loop the effect
	let id
	function loop() {
		id = requestAnimationFrame(loop)
		return fn(effect)
	}
	cleanup(() => cancelAnimationFrame(id))

	return loop()
}
