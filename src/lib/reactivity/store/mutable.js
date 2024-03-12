import { batch } from '../primitives/solid.js'
import { isNotNullObject } from '../../std/isNotNullObject.js'
import { isFunction } from '../../std/isFunction.js'
import { isArray } from '../../std/isArray.js'
import { isExtensible } from '../../std/isExtensible.js'

import {
	signalifyObject,
	signalifyUndefinedKey,
} from './signalify.js'
import { tracker, uninitialized } from './tracker.js'

/** Keeps track of what objects have already been made into a proxy */
const Proxied = new WeakMap()

/**
 * Makes a modifiable and trackeable object. Recursive. Transforms in
 * place properties into signals via get/set. Works with
 * getters/setters inherited from the immediate prototype. It only
 * affects own properties (unless inherited directly from its
 * prototype), doesn't affect functions.
 *
 * @template T
 * @param {GenericObject<T>} value
 * @returns {GenericObject<T>}
 */
export function mutable(value) {
	// log('MUTABLE')

	if (!isNotNullObject(value)) {
		return value
	}

	let proxy = Proxied.get(value)
	if (!proxy) {
		const constructor = value.constructor
		switch (constructor) {
			case Date: {
				proxy = value
				break
			}
			default: {
				signalifyObject(value, mutable)
				proxy = new Proxy(value, handler)
			}
		}
		Proxied.set(value, proxy)
		Proxied.set(proxy, proxy)
	}
	return proxy
}

/** Proxy handler */
const handler = {
	get(target, key, proxy) {
		// log('------- get', key)

		// to be able to track `undefined`
		if (!(key in target) && !isArray(target)) {
			// log('WRITE', key)
			signalifyUndefinedKey(target, key, mutable)
		}

		// log('------- get track', key)

		// tracking + value
		const value = Reflect.get(target, key, proxy)

		/** Proxy all functions so we can track mutations when possible. */
		if (isFunction(value)) {
			return (...args) => {
				/** Run functions in a batch to prevent malfunction on arrays. */
				return batch(() => {
					/**
					 * We assume value stayed the same to avoid a `read`, as the
					 * `function` is a `prop` of the `object` with the same
					 * `reference`.
					 */
					const r = Reflect.apply(value, target, args)

					if (writeMethods.has(key)) {
						// log('WRITE', key)
						tracker(target).write()
					} else {
						tracker(target).read()
					}
					return r
				})
			}
		}

		// track array
		if (isArray(target)) {
			// log('------- get track array')
			tracker(target).read()
		}

		/**
		 * A non-extensible object must return the real object, but still
		 * its properties must be tracked
		 */
		return isExtensible(target)
			? mutable(value)
			: (mutable(value), value)
	},
	set(target, key, value, proxy) {
		// log('------- set', key, value)

		/**
		 * If we deleted, or set a new property, it needs to make sure we
		 * are tracking reads.
		 */
		if (!(key in target) && !isArray(target)) {
			// log('WRITE', key)
			signalifyUndefinedKey(target, key, mutable)
		}
		return batch(() =>
			Reflect.set(target, key, mutable(value), proxy),
		)
	},
	/** Should cause track of the whole thing */
	ownKeys(target) {
		// log('--- ownKeys')
		tracker(target).read()
		return Reflect.ownKeys(target)
	},
	has(target, key) {
		// log('--- has', key)
		return batch(() => {
			tracker(target).read(key, uninitialized)
			return Reflect.has(target, key)
		})
	},
	/**
	 * When a property is deleted, the places on where it was read
	 * should re-execute.
	 *
	 * @returns {boolean}
	 */
	deleteProperty(target, key) {
		// log('--- deleteProperty', key)
		return batch(() => {
			const r = Reflect.deleteProperty(target, key)
			tracker(target).write(key, undefined)
			return r
		})
	},
	getOwnPropertyDescriptor(target, key) {
		// log('--- getOwnPropertyDescriptor', key)
		return batch(() => {
			tracker(target).read(key, uninitialized)
			return Reflect.getOwnPropertyDescriptor(target, key)
		})
	},
}

/** Write methods should be marked as writing */

export const writeMethods = new Set([
	'add',
	'append',
	'clear',
	'copyWithin',
	'delete',
	'fill',
	'insert',
	'pop',
	'prepend',
	'push',
	'put',
	'remove',
	'replace',
	'replaceWith',
	'reverse',
	'set',
	'shift',
	'sort',
	'splice',
	'unset',
	'unshift',
	'update',
	'write',
])

function log(...args) {
	//console.log(...args)
}
