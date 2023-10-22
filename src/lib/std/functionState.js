import { empty } from './empty.js'

/**
 * Keeps state in the function as a bind param
 *
 * @param {Function} fn - Function to which add state to it
 * @param {object} [state] - To which add state to it
 * @returns {Function} A copy of the function with the state
 */
export function functionState(fn, state = empty()) {
	return fn.bind(null, state)
}
