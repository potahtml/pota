import { onMount } from '../scheduler.js'

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Handler} value
 * @param {object} props
 */
export const setRef = (node, name, value, props) => value(node)

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Handler} value
 * @param {object} props
 */
export const setOnMount = (node, name, value, props) =>
	// timing is already controlled by onMount
	onMount([value, node])

/**
 * @param {Elements} node
 * @param {string} name
 * @param {Function | []} value
 * @param {object} props
 */
