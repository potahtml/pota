import {
	adoptedStyleSheetsAdd,
	classListAdd,
	getDocumentForElement,
	sheet,
	withState,
} from '../lib/std.js'

import { randomId } from '../plugin/useRandom.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {string} value
 * @param {object} props
 */
export const setCSS = (node, name, value, props) =>
	setNodeCSS(node, value)

/**
 * @param {Element} node
 * @param {string} value
 */
const setNodeCSS = withState((state, node, value) => {
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
})
