import { $reactive } from '../../constants.js'

/**
 * Marks a function as reactive. Reactive functions are ran inside
 * effects.
 *
 * @param {Function} fn - Function to mark as reactive
 * @returns {Function}
 */
export function markReactive(fn) {
	fn[$reactive] = null
	return fn
}
