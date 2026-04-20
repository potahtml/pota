import {
	defineProperty,
	entriesIncludingSymbols,
	identity,
	isExtensible,
	isFunction,
	redefineProperty,
} from '../std.js'

import { batch, untrack } from '../reactive.js'

import { $isMutable } from '../../constants.js'
import { isKeyBlacklisted } from './blacklist.js'
import { getPropertyDescriptors } from './descriptors.js'
import { tracker } from './tracker.js'

/**
 * Per-wrapper pointer back to the user's original getter/setter.
 * Proxy traps that expose descriptors (`getOwnPropertyDescriptor`)
 * and compare getter identity (`defineProperty`) unwrap through this
 * so callers never see our signalify wrappers.
 */
const originalGetSet = new WeakMap()

/**
 * @param {(() => any) | ((v) => any)} fn
 * @returns {() => any} The user's original if `fn` is one of our
 *   signalify wrappers, otherwise `fn` unchanged.
 */
export const unwrapGetSet = fn =>
	fn && originalGetSet.has(fn) ? originalGetSet.get(fn) : fn

/**
 * Transforms in place properties of an object into signals via
 * get/set. Is not recursive. Works with inherited getters/setters. It
 * doesn't track functions.
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey[]} [keys] - To transform specific keys. It is
 *   possible to signalify keys that don't exists yet.
 * @returns {T & Record<string, any>}
 */
export function signalify(target, keys) {
	// Already a mutable proxy — its own keys are already signalified
	// via signalifyObject at wrap time; re-running would double-wrap
	// and create a phantom proxy-keyed tracker.
	if (target && target[$isMutable]) return target
	keys ? signalifyKeys(target, keys) : signalifyObject(target)
	return target
}

/**
 * Signalify object properties
 *
 * @template T
 * @param {T} target
 * @param {Function} [wrapper] To wrap values
 */
export function signalifyObject(target, wrapper) {
	untrack(() => {
		const descriptors = getPropertyDescriptors(target)
		const track = tracker(target)

		for (const [key, descriptor] of entriesIncludingSymbols(
			descriptors,
		)) {
			signalifyKey(target, key, descriptor, wrapper, track)
		}
	})
}

/**
 * Signalify specific object properties
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey[]} keys - To transform specific keys. It is
 *   possible to signalify keys that don't exists yet.
 * @param {Function} [wrapper] To wrap values
 */
function signalifyKeys(target, keys, wrapper) {
	untrack(() => {
		const descriptors = getPropertyDescriptors(target)
		const track = tracker(target)

		for (const key of keys) {
			signalifyKey(target, key, descriptors[key], wrapper, track)
		}
	})
}

/**
 * Signalify a specific property
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 * @param {Function} [wrapper] To wrap values
 * @param {import('./tracker.js').Track} [track] Tracker
 */
export function signalifyKey(
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
		wrapper(descriptor.value)
		return
	}

	/**
	 * As getters shouldn't be invoked till used, we dont know the
	 * value. Assume `descriptor.value` and then check for getters once
	 * read.
	 */

	let value = descriptor.value

	/**
	 * Avoid functions when using `signalify` as it's meant to be used
	 * in classes. But do not avoid functions when it has a `wrapper`,
	 * like `mutable`.
	 */
	if (isFunction(value) && wrapper === identity) {
		return
	}

	/**
	 * If the caller handed us a descriptor that came back through one
	 * of our proxy traps (e.g. a `defineProperty` that retained a
	 * previously-installed wrapper via spec merge), unwrap to the
	 * user's originals. Ensures we never re-wrap our own wrappers and
	 * that `originalGetSet` always maps to true originals.
	 */
	if (descriptor.get) descriptor.get = unwrapGetSet(descriptor.get)
	if (descriptor.set) descriptor.set = unwrapGetSet(descriptor.set)

	const getter = descriptor.get?.bind(target)
	const setter = descriptor.set?.bind(target)

	/** Needs to wrap to recurse the object */
	if (!setter && wrapper) {
		value = wrapper(value)
	}

	/**
	 * 1. We cannot know if the getter will return the same thing that has
	 *    been set. For this reason we cant rely on the return value of
	 *    the signal.
	 * 2. We need to ensure the return value is always wrapped (for in case
	 *    of being used as a mutable).
	 * 3. For accessor descriptors we subscribe to a per-key `Getter`
	 *    signal keyed to the user's original getter identity.
	 *    `signalifyKey` writes the current getter identity below, so
	 *    `defineProperty` swapping the getter for a different identity
	 *    fires the signal; same-identity redefines are absorbed by the
	 *    signal's equality check.
	 */
	const wrapperGet = getter
		? () => {
				value = wrapper(getter())
				descriptor.get && track.getterRead(key, descriptor.get)
				return track.valueRead(key, value)
			}
		: () => {
				value = wrapper(value)
				return track.valueRead(key, value)
			}

	/** When it's only a getter it shouldn't have a setter */
	const wrapperSet =
		getter && !setter
			? undefined
			: setter
				? val => {
						batch(() => {
							value = wrapper(val)
							setter(value)
							track.valueWrite(key, value)
						})
					}
				: val => {
						batch(() => {
							value = wrapper(val)
							track.valueWrite(key, value)
						})
					}

	/**
	 * Record the user's original get/set on the wrapper so proxy traps
	 * that expose descriptors can return the originals, and identity
	 * comparisons stay meaningful.
	 */
	if (descriptor.get) originalGetSet.set(wrapperGet, descriptor.get)
	if (descriptor.set) originalGetSet.set(wrapperSet, descriptor.set)

	defineProperty(target, key, {
		get: wrapperGet,
		set: wrapperSet,
		enumerable: descriptor.enumerable,
		configurable: true,
	})

	/**
	 * Publish the current getter identity so subscribers on the
	 * `Getter` signal fire when the user swaps the getter via
	 * `defineProperty`. Same-identity redefines are absorbed by the
	 * signal's equality check (a no-op write).
	 */
	descriptor.get && track.getterWrite(key, descriptor.get)
}

/**
 * Signalify an undefined property
 *
 * @template T
 * @param {T} target
 * @param {PropertyKey} key
 * @param {Function} [wrapper] To wrap values
 * @param {import('./tracker.js').Track} [track] Tracker
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
		redefineProperty(target, key, {
			get() {
				return track.valueRead(key, value)
			},
			set(val) {
				batch(() => {
					value = wrapper(val)
					track.valueWrite(key, value)
				})
			},
		})
	}
}
