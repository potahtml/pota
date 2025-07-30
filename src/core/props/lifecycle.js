import { cleanup } from '../../lib/reactive.js'

import { onMount } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 */
export const setRef = (node, name, value) => {
	value(node)
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 */
export const setConnected = (node, name, value) => {
	onMount(() => value(node))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 */
export const setDisconnected = (node, name, value) => {
	cleanup(() => value(node))
}
