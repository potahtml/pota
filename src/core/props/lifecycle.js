import { cleanup } from '../../lib/reactive.js'
import { flatForEach } from '../../lib/std.js'

import { onMount } from '../scheduler.js'

/**
 * Invokes `ref` callbacks immediately with the element instance.
 *
 * @param {Element} node
 * @param {Function} value
 */
export const setRef = (node, value) => {
	flatForEach(value, fn => fn(node))
}

/**
 * Runs callbacks once the node is connected (after mount).
 *
 * @param {Element} node
 * @param {Function} value
 */
export const setConnected = (node, value) => {
	onMount(() => flatForEach(value, fn => fn(node)))
}

/**
 * Registers cleanup callbacks that fire when the scope disposes.
 *
 * @param {Element} node
 * @param {Function} value
 */
export const setDisconnected = (node, value) => {
	cleanup(() => flatForEach(value, fn => fn(node)))
}
