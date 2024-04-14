import {
	signal,
	syncEffect,
	batch,
	cleanup,
	root,
} from '../lib/reactivity/reactive.js'

import { Component, toHTML } from './@main.js'

import { callAll } from '../lib/std/callAll.js'
import { camelCase } from '../lib/strings/camel-case.js'
import { empty } from '../lib/std/empty.js'
import { entries } from '../lib/std/entries.js'
import { flat } from '../lib/std/flat.js'
import { fromEntries } from '../lib/std/fromEntries.js'
import { id, parse } from '../lib/dom/parse.js'
import { toArray } from '../lib/std/toArray.js'
import { weakStore } from '../lib/std/weakStore.js'

import * as defaultRegistryTemplate from '../web/flow/@main.js'

const defaultRegistry = fromEntries(
	entries(defaultRegistryTemplate).map(([k, v]) => [
		k.toLowerCase(),
		v,
	]),
)

/**
 * Function to create cached tagged template components
 *
 * @param {object} [options]
 * @param {boolean} [options.unwrap] - To return a `Node/Element` or
 *   an array of `Node/Elements`. Defaults to `true`
 * @returns {Function & {
 * 	define: ({ components }) => void
 * 	components: {}
 * }}
 * @url https://pota.quack.uy/HTML
 */

export function HTML(options = { unwrap: true }) {
	const components = { ...defaultRegistry }

	/**
	 * Creates tagged template components
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...any} values
	 * @returns {Children}
	 * @url https://pota.quack.uy/HTML
	 */

	function html(template, ...values) {
		const cached = parse(template)

		let index = 0
		function nodes(node) {
			// Node.ELEMENT_NODE
			if (node.nodeType === 1) {
				const localName = node.localName
				if (localName === id) {
					return values[index++]
				}

				// gather props
				const props = empty()
				for (let { name, value } of node.attributes) {
					if (value === id) {
						value = values[index++]
					}

					if (name[0] === '.') {
						props['prop:' + camelCase(name.slice(1))] = value
					} else if (name[0] === '?') {
						props['bool:' + name.slice(1)] = value
					} else if (name[0] === '@') {
						props['on:' + name.slice(1)] = value
					} else {
						props[name] = value
					}
				}

				// gather children
				if (node.childNodes.length) {
					props.children = flat(toArray(node.childNodes).map(nodes))
				}

				return Component(components[localName] || localName, props)
			} else {
				return node.cloneNode()
			}
		}

		const result = flat(toArray(cached.childNodes).map(nodes))

		return options.unwrap ? toHTML(result) : result
	}

	html.components = components
	html.define = userComponents => {
		let name
		for (name in userComponents) {
			components[name.toLowerCase()] = userComponents[name]
		}
	}

	return html
}

export const html = HTML()

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
 * @param {boolean} [options.updateTrigger] - To return an `update`
 *   function in case its desired to trigger updates manually.
 *   Defaults to `false`
 * @returns {Children}
 * @url https://pota.quack.uy/HTML
 */
export const htmlEffect = (
	fn,
	options = { unwrap: true, updateTrigger: false },
) => {
	/** Copy the components from the global registry */
	const html_ = HTML(options)
	html_.components = html.components

	const [get, set] = weakStore()

	const disposeHTMLEffect = []

	function _html(template, ...values) {
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
				for (let key = 0; key < values.length; key++) {
					// getValue(value) causes tracking
					cached[0][key].write(values[key])
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
			return cached[1]
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
		let result
		root(dispose => {
			disposeHTMLEffect.push(dispose)

			/**
			 * HTML is created with the `signals` in place of the `values`.
			 * Pota will add one effect for each signal. So this wont
			 * re-run.
			 */
			result = html_(
				template,
				...values.map((value, key) => {
					signals[key] = signal(value)
					// give accesors to template instead of the `values`
					return signals[key].read
				}),
			)
		})

		// save the `signals` in the cached template
		set(template, [signals, result])
		return result
	}

	/**
	 * This effect will re-run when the `values` interpolated change, or
	 * when any signal that you use on the `htmlEffect` function body
	 * change. It cause re-runs of what we are batching above.
	 */

	const update = () => fn(_html)

	let result

	syncEffect(() => {
		result = update()
	})

	/** Dispose the effect when whatever started it is disposed. */
	cleanup(() => callAll(disposeHTMLEffect))

	return options.updateTrigger ? [result, update] : result
}
