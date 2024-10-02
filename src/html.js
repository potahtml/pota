import {
	batch,
	cleanup,
	root,
	signal,
	syncEffect,
} from './lib/reactive.js'

import {
	call,
	createElement,
	empty,
	entries,
	flat,
	fromEntries,
	toArray,
	weakStore,
	withCache,
	withState,
} from './lib/std.js'

import { dashesToCamelCase } from './plugin/useString.js'

import { Component } from './renderer.js'

import {
	A as RouterA,
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

const defaultRegistry = fromEntries(
	entries({
		RouterA,
		Collapse,
		Dynamic,
		For,
		Head,
		Match,
		Portal,
		Router,
		Show,
		Switch,
	}).map(([k, v]) => [k.toLowerCase(), v]),
)

// parseHTML

const id = 'pota'
const tag = `<pota></pota>`

/**
 * Makes Nodes from TemplateStringsArray
 *
 * @param {TemplateStringsArray} content
 * @returns {Element}
 */
const parseHTML = withCache(content => {
	const template = createElement('template')

	template.innerHTML = content
		.join(tag)
		.replaceAll(`"${tag}"`, `"${id}"`)
		// avoid double br when self-closing
		.replace(/<(br|hr)\s*\/\s*>/g, '<$1>')
		// self-close
		.replace(/<([a-z-]+)([^/>]*)\/\s*>/gi, '<$1 $2></$1>')

	return template.content
})

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
		const cached = parseHTML(template)

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
						props['prop:' + dashesToCamelCase(name.slice(1))] = value
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

				return Component(
					html.components[localName] || localName,
					props,
				)
			} else {
				return node.cloneNode()
			}
		}

		return flat(toArray(cached.childNodes).map(nodes))
	}

	html.components = { ...defaultRegistry }
	html.define = userComponents => {
		let name
		for (name in userComponents) {
			html.components[name.toLowerCase()] = userComponents[name]
		}
	}

	return html
}

/**
 * Runs an `effect` on an `html` template. Reacts to reactive
 * interpolated values, or to the reactivity used in the body of the
 * function you pass.
 *
 * @param {(html: Function) => Children} fn - Function to run as an
 *   effect. It receives `html` argument for template creation.
 * @returns {Children}
 * @url https://pota.quack.uy/HTML
 */
export const htmlEffect = fn => {
	/** Copy the components from the global registry */
	const html_ = HTML()
	html_.components = { ...html.components }

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
			 * It needs to return the result because when nesting (ex
			 * calling html twice inside the htmlEffect), the second call
			 * will use the value of the first call. The result is a
			 * reference to the nodes created before, so it always use the
			 * same nodes, and reactivity on these nodes is live.
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

	let result

	syncEffect(() => {
		result = fn(_html)
	})

	/** Dispose the effect when whatever started it is disposed. */
	cleanup(() => call(disposeHTMLEffect))

	return result
}

export const html = HTML()
