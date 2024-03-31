import { getPrototypeOf } from './getPrototypeOf.js'
import { setPrototypeOf } from './setPrototypeOf.js'

/**
 * Replace a prototype in the prototype chain with another prototype
 *
 * @param {object} target - Target object
 * @param {object} search - The prototype to replace
 * @param {object} replacement - The replacement prototype
 */
export function replacePrototypeWith(target, search, replacement) {
	let prototype = target
	while (getPrototypeOf(prototype) !== search) {
		prototype = getPrototypeOf(prototype)
	}

	setPrototypeOf(prototype, replacement)
}
