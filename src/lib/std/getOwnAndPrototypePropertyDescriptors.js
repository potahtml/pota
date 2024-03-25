import { isBlacklisted } from '../reactivity/store/blacklist.js'
import { assign } from './assign.js'
import { empty } from './empty.js'
import { getOwnPropertyDescriptors } from './getOwnPropertyDescriptors.js'
import { getPrototypeOf } from './getPrototypeOf.js'

/**
 * It returns `target` descriptors + `target.prototype` descriptors.
 *
 * It checks for getters/setters of the class instance (these
 * properties not defined in the object itself), by looking at its
 * prototype. The idea is that if the prototype provides some
 * getters/setters, then, we should be able to track them too.
 */
export function getOwnAndPrototypePropertyDescriptors(target) {
	const constructor = target?.constructor

	// common built-ins don't have prototype getters/setters
	if (constructor === Object || constructor === undefined) {
		return getOwnPropertyDescriptors(target)
	}

	// blacklisted by default
	if (isBlacklisted(target)) {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
		return empty()
	}

	// object may be an instance of a class with getters/setters
	return assign(
		empty(),
		getOwnPropertyDescriptors(getPrototypeOf(target)),
		getOwnPropertyDescriptors(target),
	)
}
