import { $internal } from '../constants.js'
import {
	signal,
	effect,
	renderEffect,
	batch,
	cleanup,
	root,
} from '../lib/reactivity/primitives/solid.js'
import { empty } from '../lib/std/empty.js'
import { entries } from '../lib/std/entries.js'
import { flat } from '../lib/std/flat.js'
import { getValue } from '../lib/std/getValue.js'
import { toArray } from '../lib/std/toArray.js'
import { weakStore } from '../lib/std/weakStore.js'

import { Component, createElement, toHTML } from './@renderer.js'

const { get, set } = weakStore()

/**
 * Function to create tagged template components
 *
 * @param {object} [options]
 * @param {boolean} [options.unwrap] - To return a `Node/Element` or
 *   an array of `Node/Elements`. Defaults to `true`
 * @returns {Function & {
 * 	define: ({ components }) => void
 * 	components: {}
 * }}
 */
export function HTML(options = { unwrap: true }) {
	/**
	 * Creates tagged template components
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...any} values
	 * @returns {Children}
	 */
	function html(template, ...values) {
		let cached = get(template)
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

			set(template, cached)
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
				 * only if `childNodes` has something
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

				// needs to return a function so reactivity works properly
				return Component(html.components[tag] || tag, props)
			} else {
				return node
			}
		}

		// flat to return a single element if possible to make it more easy to use
		const children = flat(nodes(clone))

		cached.result = options.unwrap
			? toNodes(toHTML(children, $internal))
			: children

		return cached.result
	}

	html.components = empty()
	html.define = userComponents => {
		for (const [name, component] of entries(userComponents)) {
			html.components[name.toUpperCase()] = component
		}
	}

	return html
}

export const html = HTML({ unwrap: true })

/**
 * Runs an `effect` on an `html` template. Reacts to reactive
 * interpolated values, or to the reactivity used in the body of the
 * function you pass.
 *
 * @param {(html) => any} fn - Function to run as an effect. It
 *   receives `html` argument for template creation.
 * @param {object} [options]
 * @param {boolean} [options.unwrap] - To return a `Node/Element` or
 *   an array of `Node/Elements`. Defaults to `true`
 * @returns {Children}
 */
export const htmlEffect = (fn, options = { unwrap: true }) => {
	/** Copy the components from the global registry */
	const html_ = options.unwrap ? html : HTML(options)
	html_ !== html && (html_.components = { ...html.components })

	let disposeHTMLEffect = []

	const _html = (template, ...values) => {
		// when template is cached just update the signals
		let cached = get(template)
		if (cached) {
			/**
			 * Purpose:
			 *
			 * 1. Track the `values` by reading, so we track the interpolated
			 *    values.
			 * 2. Aditionally, this will also rerun when reactive values used
			 *    on the body of the function you pass to the effect
			 *    update.
			 * 3. Update the `signals` when `values` change.
			 *
			 * It batches changes so it updates the template in one shot
			 */
			batch(() => {
				for (let [key, value] of entries(values)) {
					// getValue(value) causes tracking
					cached.signals[key][1](getValue(value))
				}
			})

			/**
			 * It needs to return the result because when used unwrapped and
			 * nesting (ex calling html twice inside the htmlEffect), the
			 * second call will use the value of the first call. The result
			 * is a reference to the nodes created before, so it always use
			 * the same nodes, and reactivity on these nodes is live.
			 *
			 * ```js
			 * htmlEffect(html => {
			 * 	const ELEMENTS = html`<div>
			 * 		double ${data.test * 2}
			 * 	</div>`
			 * 	// ^ these elements are needed in the next line
			 * 	return html`<div>${data.test} ${ELEMENTS}</div>`
			 * })
			 * ```
			 */
			return cached.result
		}

		/**
		 * Creates the html with `signals` in place of the interpolated
		 * `values`. This is to avoid having to create the template more
		 * than once. Once the template is created, then the only thing
		 * that will update is the `signals`.
		 *
		 * It creates a root because when any of the `values` changes
		 * inside the body of the function that you pass to `htmlEffect`,
		 * or when the interpolated `values` change, it causes disposal
		 * (aka removing the elements), and htmlEffect re-runs. To avoid
		 * having the elements removed by the disposal of the body of your
		 * own function we create a root.
		 */
		const signals = []
		const result = root(dispose => {
			disposeHTMLEffect.push(dispose)

			/**
			 * HTML is created with the `signals` in place of the `values`.
			 * Pota will add one effect for each signal. So this wont
			 * re-run.
			 */
			return html_(
				template,
				...values.map((value, key) => {
					signals[key] = signal(getValue(value))
					// give accesors to template instead of the `values`
					return signals[key][0]
				}),
			)
		})

		// save the `signals` in the cached template
		cached = get(template)
		cached.signals = signals

		return result
	}

	// use the registry of the real `html` function
	_html.define = components => html_.define(components)

	let result
	/**
	 * This effect will re-run when the `values` interpolated change, or
	 * when any signal that you use on the `htmlEffect` function body
	 * change. It cause re-runs of what we are batching above.
	 */
	renderEffect(() => {
		result = fn(_html)
	})

	/** Dispose the effect when whatever started it is disposed. */
	cleanup(() => {
		for (const dispose of disposeHTMLEffect) {
			dispose()
		}
	})

	return result
}

/**
 * DocumentFragment is transformed to an `Array` of `Node/Element`,
 * that way we can keep a reference to the nodes. Because when the
 * DocumentFragment is used, it removes the nodes from the
 * DocumentFragment and then we will lose the reference.
 */
const toNodes = nodes =>
	nodes instanceof DocumentFragment
		? toArray(nodes.childNodes)
		: nodes
