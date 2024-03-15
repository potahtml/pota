import { defineProperty } from '../../std/defineProperty.js'
import { entries } from '../../std/entries.js'
import { getOwnAndPrototypePropertyDescriptors } from '../../std/getOwnAndPrototypePropertyDescriptors.js'
import { isExtensible } from '../../std/isExtensible.js'
import { isFunction } from '../../std/isFunction.js'
import { batch } from '../primitives/solid.js'

import { tracker } from './tracker.js'

/**
 * Transforms in place properties of an object into signals via
 * get/set. Is not recursive. Works with getters/setters inherited
 * from the immediate prototype. It only affects own properties
 * (unless inherited directly from its prototype), doesn't affect
 * functions.
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

	for (const [key, descriptor] of entries(descriptors)) {
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
	wrapper = value => value,
	track,
) {
	if (key === 'constructor') {
		return
	}

	/** Happens when they are signalifying a key that doesn't exists */
	if (!descriptor) {
		return signalifyUndefinedKey(target, key, wrapper, track)
	}

	/** Avoid keys that cannot be redefined */
	if (!descriptor.configurable) {
		// to proxy nested configurable objects
		if ('value' in descriptor) {
			wrapper(descriptor.value)
		}
		return
	}

	/** Avoid functions */
	if ('value' in descriptor && isFunction(descriptor.value)) {
		return
	}

	const get = descriptor.get?.bind(target)
	const set = descriptor.set?.bind(target)

	/**
	 * As getters shouldn't be invoked till used, we dont know the
	 * value. Assume `descriptor.value` and then check for getters once
	 * read.
	 */

	let value = wrapper(descriptor.value)

	track = track || tracker(target)

	defineProperty(target, key, {
		get() {
			/**
			 * We cannot know if the getter will return the same thing that
			 * has been set. We need to ensure the return value is always
			 * wrapped (for in case of being used as a mutable).
			 */
			value = wrapper(get ? get() : value)
			return track.read(key, value)
		},

		set:
			/** When it's only a getter it shouldnt have a setter */
			get && !set
				? undefined
				: val => {
						batch(() => {
							/**
							 * For some reason I cannot explain, it breaks if we do:
							 *
							 * ```js
							 * value = wrapper(value)
							 * ```
							 */
							value = wrapper(val)
							set && set(value)
							track.write(key, value)
						})
					},
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
 */
export function signalifyUndefinedKey(
	target,
	key,
	wrapper = value => value,
	track,
) {
	if (key === 'constructor') {
		return
	}

	if (isExtensible(target)) {
		track = track || tracker(target)

		let value = undefined
		defineProperty(target, key, {
			get() {
				return track.read(key, value)
			},
			set(val) {
				batch(() => {
					/**
					 * For some reason I cannot explain, it breaks if we do:
					 *
					 * ```js
					 * value = wrapper(value)
					 * ```
					 */
					value = wrapper(val)
					track.write(key, value)
				})
			},
		})
	}
}
