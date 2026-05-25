import {
	assign,
	empty,
	getOwnPropertyDescriptors,
	getPrototypeOf,
	nothing,
} from '../std.js'

import {
	isMutationBlacklisted,
	isPrototypeBlacklisted,
} from './blacklist.js'

/**
 * It returns all property descriptors for `target`.
 *
 * It checks for getters/setters of the prototype chain. The idea is
 * that if the prototype provides some getters/setters, then, we
 * should be able to track them too.
 */
export function getPropertyDescriptors(target) {
	// blacklisted by default
	if (isMutationBlacklisted(target)) {
		return nothing
	}

	let proto = getPrototypeOf(target)

	/** Walk the prototype chain to gather getters/setters */
	const protos = [target]
	while (proto && !isPrototypeBlacklisted(proto)) {
		protos.push(proto)
		proto = getPrototypeOf(proto)
	}

	/** Cocktail */
	const descriptors = empty()
	for (const proto of protos.reverse()) {
		assign(descriptors, getOwnPropertyDescriptors(proto))
	}

	return descriptors
}
