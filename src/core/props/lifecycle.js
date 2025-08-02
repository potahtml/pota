import { cleanup } from '../../lib/reactive.js'

import { onMount } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setRef = (node, value) => {
	value(node)
}

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setConnected = (node, value) => {
	onMount(() => value(node))
}

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setDisconnected = (node, value) => {
	cleanup(() => value(node))
}
