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
	createTextNode,
	empty,
	flat,
	freeze,
	toArray,
	weakStore,
	withWeakCache,
} from './lib/std.js'

import { Component, toHTML, toHTMLFragment } from './renderer.js'
import { assignProps } from './props/@main.js'

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
const parseHTML = withWeakCache(content =>
	new DOMParser().parseFromString(
		`<xml ${xmlns}>${content.join(id)}</xml>`,
		'text/xml',
	),
)

/**
 * Recursively walks a template and transforms it to `h` calls
 *
 * @param {{ components: {} }} html
 * @param {HTMLElement} cached
 * @param {...any} values
 * @returns {Children}
 */
function toH(html, cached, values) {
	let index = 0
	function nodes(node) {
		// Node.ELEMENT_NODE
		if (node.nodeType === 1) {
			const localName = node.localName

			// gather props
			const props = empty()
			for (let { name, value } of node.attributes) {
				if (value === id) {
					value = values[index++]
				}
				props[name] = value
			}

			// gather children
			if (node.childNodes.length) {
				props.children = flat(toArray(node.childNodes).map(nodes))
			}

			return Component(html.components[localName] || localName, props)
		} else {
			if (node.data.includes(id)) {
				const textNodes = node.data.split(id)
				const nodes = []
				for (let i = 0; i < textNodes.length; i++) {
					const text = textNodes[i]
					if (text) {
						nodes.push(createTextNode(text))
					}
					if (i < textNodes.length - 1) {
						nodes.push(values[index++])
					}
				}
				return nodes
			}
			return createTextNode(node.data)
		}
	}

	return flat(toArray(cached.childNodes).map(nodes))
}

function toPartial(html, cached, values) {
	if (!cached.partial) {
		const walker = document.createTreeWalker(cached)

		const actions = []
		while (walker.nextNode()) {
			const node = walker.currentNode
			switch (node.nodeType) {
				case 1: {
					const localName = node.localName
					// its a component
					if (html.components[localName]) {
						const props = empty()
						const propsReplace = []
						for (let { name, value } of node.attributes) {
							if (name === id) {
								propsReplace.push(name)
							}
							props[name] = value
						}

						// gather children
						if (node.childNodes.length) {
							props.children = createTextNode('the children') //flat(toArray(node.childNodes).map(nodes))
						}

						const pota = createElement('pota')
						node.replaceWith(pota)
						walker.currentNode = pota

						freeze(props)
						actions.push((node, values, walker) => {
							const p = { ...props }
							for (const name of propsReplace) {
								p[name] = values()
							}
							const replacement = toHTMLFragment(
								Component(html.components[localName], p),
							)
							node.replaceWith(replacement)

							walker.currentNode = replacement
						})
					} else {
						const props = empty()
						const propsReplace = []
						const toRemove = []
						for (let { name, value } of node.attributes) {
							if (value === id) {
								propsReplace.push(name)
								toRemove.push(name)
							} else if (/^[a-z]+:/.test(name)) {
								props[name] = value
								toRemove.push(name)
							}
						}

						if (toRemove.length) {
							node.setAttribute('pota', '')
							for (const attribute of toRemove) {
								node.removeAttribute(attribute)
							}
							freeze(props)
							actions.push((node, values) => {
								const p = { ...props }
								for (const name of propsReplace) {
									p[name] = values()
								}
								assignProps(node, p)
							})
						}
					}

					break
				}
				case 3: {
					// text
					if (node.data.includes(id)) {
						const textNodes = node.data.split(id)
						const nodes = []
						for (let i = 0; i < textNodes.length; i++) {
							const text = textNodes[i]
							if (text) {
								nodes.push(createTextNode(text))
							}
							if (i < textNodes.length - 1) {
								actions.push((node, values, walker) => {
									const replacement = toHTML(values())
									console.log(replacement)
									node.replaceWith(replacement)
									// walker gps
									walker.currentNode = replacement
								})
								nodes.push(createElement('pota'))
							}
						}
						node.replaceWith(...nodes)
						// walker gps
						walker.currentNode = nodes[nodes.length - 1]
					}

					break
				}
				default: {
					console.log('unknown', node, node.nodeType)
				}
			}
		}

		const template = createElement('template')
		template.innerHTML = cached.firstChild.innerHTML.replace(
			/pota xmlns="[^"]+"/g,
			'pota',
		)
		cached.partial = function (values) {
			console.log('clonning', template.content)
			const clone = template.cloneNode(true)
			console.log('clone', clone.content)
			const walker = document.createTreeWalker(clone.content, 1)
			let index = 0
			let valueIndex = 0
			const value = () => values[valueIndex++]
			while (walker.nextNode()) {
				const node = walker.currentNode
				if (node.hasAttribute('pota')) {
					actions[index++](node, value, walker)
				} else if (node.localName === 'pota') {
					actions[index++](node, value, walker)
				}
			}

			return clone.content
		}
	}
	return cached.partial(values)
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
		const cached = parseHTML(template)

		return toH(html, cached.firstChild, values) // toPartial(html, cached, values) //
	}

	html.components = { ...defaultRegistry }
	html.define = userComponents => {
		for (const name in userComponents) {
			html.components[name] = userComponents[name]
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
