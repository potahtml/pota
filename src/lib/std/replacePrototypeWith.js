import { getPrototypeOf } from './getPrototypeOf.js'
import { setPrototypeOf } from './setPrototypeOf.js'

/**
 * Replace a prototype in the prototype chain with another prototype
 *
 * @param {Object} target - Target object
 * @param {Object} search - The prototype to replace
 * @param {Object} replacement - The replacement prototype
 */
export function replacePrototypeWith(target, search, replacement) {
	let prototype = target
	while (getPrototypeOf(prototype) !== search) {
		prototype = getPrototypeOf(prototype)
	}

	setPrototypeOf(prototype, replacement)
}
