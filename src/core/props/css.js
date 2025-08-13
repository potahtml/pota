import { withState } from '../../lib/std.js'
import { addAdoptedStyleSheet, sheet } from '../../use/css.js'
import {
	addClass,
	getDocumentForElement,
	isConnected,
} from '../../use/dom.js'

import { randomId } from '../../use/random.js'
import { onMount } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {string} value
 */
export const setCSS = (node, value) => {
	isConnected(node)
		? setNodeCSS(node, value)
		: onMount(() => {
				setNodeCSS(node, value)
			})
}

/** @type {(node: Element, value: string) => void} */
const setNodeCSS = withState((state, node, value) => {
	if (value) {
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
	}
})
