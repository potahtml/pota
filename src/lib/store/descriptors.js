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
	const constructor = target?.constructor

	// common built-ins prototype getters/setters are ignored
	if (constructor === Object || constructor === undefined) {
		return getOwnPropertyDescriptors(target)
	}

	// blacklisted by default
	if (isMutationBlacklisted(target)) {
		return nothing
	}

	/**
	 * Walk the prototype chain to gather getters/setters from
	 * prototypes.
	 */
	let proto = getPrototypeOf(target)

	if (isPrototypeBlacklisted(proto)) {
		return nothing
	}

	/** Gather getters/setters from prototype */
	const protos = []
	while (proto && !isPrototypeBlacklisted(proto)) {
		protos.push(proto)
		proto = getPrototypeOf(proto)
	}
	const descriptors = empty()
	for (const proto of protos.reverse()) {
		assign(descriptors, getOwnPropertyDescriptors(proto))
	}
	// TODO MOVE THIS UP
	// Gather getters/setters from target
	if (!isPrototypeBlacklisted(target)) {
		assign(descriptors, getOwnPropertyDescriptors(target))
	}
	// console.log(descriptors, target)
	return descriptors
}
