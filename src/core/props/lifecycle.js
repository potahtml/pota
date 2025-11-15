import { cleanup } from '../../lib/reactive.js'
import { flatForEach } from '../../lib/std.js'

import { onMount } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setRef = (node, value) => {
	flatForEach(value, fn => fn(node))
}

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setConnected = (node, value) => {
	onMount(() => flatForEach(value, fn => fn(node)))
}

/**
 * @param {Element} node
 * @param {Function} value
 */
export const setDisconnected = (node, value) => {
	cleanup(() => flatForEach(value, fn => fn(node)))
}
