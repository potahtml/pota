import { queueMicrotask, withState } from '../../lib/std.js'
import { adoptedStyleSheetsAdd, sheet } from '../../use/css.js'
import { classListAdd, getDocumentForElement } from '../../use/dom.js'

import { randomId } from '../../use/random.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {string} value
 * @param {object} props
 */
export const setCSS = (node, name, value, props) => {
	setNodeCSS(node, value)
}

/** @type {(node: Element, value: string) => void} */
const setNodeCSS = withState(
	(state, node, value, retrying = false) => {
		if (!node.isConnected && !retrying) {
			return queueMicrotask(() => setNodeCSS(node, value, true))
		}

		classListAdd(
			node,
			state.get(value, value => {
				const id = 'c' + randomId()
				adoptedStyleSheetsAdd(
					getDocumentForElement(node),
					sheet(value.replace(/class/g, '.' + id)),
				)
				return id
			}),
		)
	},
)
