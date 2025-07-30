import { queueMicrotask, withState } from '../../lib/std.js'
import { addAdoptedStyleSheet, sheet } from '../../use/css.js'
import { addClass, getDocumentForElement } from '../../use/dom.js'

import { randomId } from '../../use/random.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {string} value
 */
export const setCSS = (node, name, value) => {
	setNodeCSS(node, value)
}

/** @type {(node: Element, value: string) => void} */
const setNodeCSS = withState(
	(state, node, value, retrying = false) => {
		if (!node.isConnected && !retrying) {
			return queueMicrotask(() => setNodeCSS(node, value, true))
		}

		addClass(
			node,
			state.get(value, value => {
				const id = 'c' + randomId()
				addAdoptedStyleSheet(
					getDocumentForElement(node),
					sheet(value.replace(/class/g, '.' + id)),
				)
				return id
			}),
		)
	},
)
