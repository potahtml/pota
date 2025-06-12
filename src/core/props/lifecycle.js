import { cleanup } from '../../lib/reactive.js'

import { onMount, onRef } from '../scheduler.js'

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setRef = (node, name, value, props) => {
	onRef(() => value(node))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setConnected = (node, name, value, props) => {
	onMount(() => value(node))
}

/**
 * @param {Element} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setDisconnected = (node, name, value, props) => {
	cleanup(() => value(node))
}
