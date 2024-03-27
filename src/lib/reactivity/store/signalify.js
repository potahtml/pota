import {
	defineProperty,
	redefineProperty,
} from '../../std/defineProperty.js'
import { entriesIncludingSymbols } from '../../std/entriesIncludingSymbols.js'
import { getOwnAndPrototypePropertyDescriptors } from '../../std/getOwnAndPrototypePropertyDescriptors.js'
import { identity } from '../../std/identity.js'
import { isExtensible } from '../../std/isExtensible.js'
import { isFunction } from '../../std/isFunction.js'

import { batch } from '../primitives/solid.js'

import { tracker, trackerValueSignal } from './tracker.js'
import { isKeyBlacklisted } from './blacklist.js'

/**
 * Transforms in place properties of an object into signals via
 * get/set. Is not recursive. Works with inherited getters/setters. It
 * doesn't track functions.
 *
 * @template T
 * @param {GenericObject<T>} target
 * @param {PropertyKey[]} [keys] - To transform specific keys. It is
 *   possible to signalify keys that don't exists yet.
 * @returns {GenericObject<T>}
 */
export function signalify(target, keys) {
	keys ? signalifyKeys(target, keys) : signalifyObject(target)
	return target
}

/**
 * Signalify object properties
 *
 * @template T
 * @param {GenericObject<T>} target
 * @param {Function} [wrapper] To wrap values
 */
export function signalifyObject(target, wrapper) {
	const descriptors = getOwnAndPrototypePropertyDescriptors(target)
	const track = tracker(target)

	for (const [key, descriptor] of entriesIncludingSymbols(
		descriptors,
	)) {
		signalifyKey(target, key, descriptor, wrapper, track)
	}
}

/**
 * Signalify specific object properties
 *
 * @template T
 * @param {GenericObject<T>} target
 * @param {PropertyKey[]} keys - To transform specific keys. It is
 *   possible to signalify keys that don't exists yet.
 * @param {Function} [wrapper] To wrap values
 */
export function signalifyKeys(target, keys, wrapper) {
	const descriptors = getOwnAndPrototypePropertyDescriptors(target)
	const track = tracker(target)

	for (const key of keys) {
		signalifyKey(target, key, descriptors[key], wrapper, track)
	}
}

/**
 * Signalify a specific property
 *
 * @template T
 * @param {GenericObject<T>} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 * @param {Function} [wrapper] To wrap values
 * @param {any} [track] Tracker
 */
function signalifyKey(
	target,
	key,
	descriptor,
	wrapper = identity,
	track,
) {
	if (isKeyBlacklisted(key)) {
		return
	}

	/** Happens when they are signalifying a key that doesn't exists */
	if (!descriptor) {
		return signalifyUndefinedKey(target, key, wrapper, track)
	}

	/** Avoid keys that cannot be redefined */
	if (!descriptor.configurable) {
		/** Proxy nested configurable objects */
		if ('value' in descriptor) {
			wrapper(descriptor.value)
		}
		return
	}

	/**
	 * Avoid functions when using `signalify` as it's meant to be used
	 * in classes. But do not avoid functions when it has a `wrapper`,
	 * like `mutable`.
	 */
	if (
		wrapper === identity &&
		'value' in descriptor &&
		isFunction(descriptor.value)
	) {
		return
	}

	/**
	 * As getters shouldn't be invoked till used, we dont know the
	 * value. Assume `descriptor.value` and then check for getters once
	 * read.
	 */

	let value = wrapper(descriptor.value)

	// tracker
	const [read, write] = trackerValueSignal(target, track, key)

	const getter = descriptor.get?.bind(target)
	const setter = descriptor.set?.bind(target)

	defineProperty(target, key, {
		get() {
			/**
			 * 1. We cannot know if the getter will return the same thing that
			 *    has been set. For this reason we cant rely on the return
			 *    value of the signal.
			 * 2. We need to ensure the return value is always wrapped (for in
			 *    case of being used as a mutable).
			 */
			value = wrapper(getter ? getter() : value)
			return read(value)
		},

		set:
			/** When it's only a getter it shouldn't have a setter */
			getter && !setter
				? undefined
				: val => {
						batch(() => {
							value = wrapper(val)
							setter && setter(value)
							write(value)
						})
					},
		enumerable: descriptor.enumerable,
		configurable: true,
	})
}

/**
 * Signalify an undefined property
 *
 * @template T
 * @param {GenericObject<T>} target
 * @param {PropertyKey} key
 * @param {Function} [wrapper] To wrap values
 * @param {any} [track] Tracker
 * @param {any} [value] Default value
 */
export function signalifyUndefinedKey(
	target,
	key,
	wrapper = identity,
	track,
	value = undefined,
) {
	if (isKeyBlacklisted(key)) {
		return
	}

	if (isExtensible(target)) {
		const [read, write] = trackerValueSignal(target, track, key)

		redefineProperty(target, key, {
			get() {
				return read(value)
			},
			set(val) {
				batch(() => {
					value = wrapper(val)
					write(value)
				})
			},
		})
	}
}
