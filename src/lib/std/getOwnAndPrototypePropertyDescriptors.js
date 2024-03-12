import { assign } from './assign.js'
import { empty } from './empty.js'
import { getOwnPropertyDescriptors } from './getOwnPropertyDescriptors.js'
import { getPrototypeOf } from './getPrototypeOf.js'

/**
 * It returns `target` descriptors + `target prototype` descriptors.
 *
 * It checks for getters/setters of the class instance (these
 * properties not defined in the object itself), by looking at its
 * prototype. The idea is that if the prototype provides some
 * getters/setters, then, we should be able to track them too.
 */
export function getOwnAndPrototypePropertyDescriptors(target) {
	const constructor = target?.constructor

	switch (constructor) {
		case Object:
		case undefined: {
			// common built-ins don't have getters/setters or are ignored
			return getOwnPropertyDescriptors(target)
		}
		case Array:
		case Date: {
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
			// blacklisted by default
			return empty()
		}
		default: {
			// object may be an instance of a class with getters/setters
			return assign(
				empty(),
				getOwnPropertyDescriptors(getPrototypeOf(target)),
				getOwnPropertyDescriptors(target),
			)
		}
	}
}
