import { getValue } from './getValue.js'

/**
 * Unwraps `value` and returns `element` if result is a `Node`, else
 * `undefined` in the case isn't a `Node`
 *
 * @param {Function | any} value - Maybe function
 * @param {...any} args? - Arguments
 * @returns {Node | undefined}
 */
export function getValueElement(value, ...args) {
	const element = getValue(value, ...args)
	return element instanceof Node ? element : undefined
}
