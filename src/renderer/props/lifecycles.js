import { cleanup } from '../../lib/reactivity/reactive.js'
import { onMount } from '../scheduler.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setRef = (node, name, value, props) => value(node)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setOnMount = (node, name, value, props) =>
	// timing is already controlled by onMount
	onMount([value, node])

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function} value
 * @param {object} props
 */
export const setUnmount = (node, name, value, props) =>
	// we need to ensure the timing of the cleanup callback
	// so we queue it to run it at a specific time
	cleanup(() => value(node))
