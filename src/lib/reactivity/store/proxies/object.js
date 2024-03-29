import {
	reflectApply,
	reflectGet,
	reflectSet,
} from '../../../std/reflect.js'
import { isExtensible } from '../../../std/isExtensible.js'
import { isFunction } from '../../../std/isFunction.js'

import { batch } from '../../primitives/solid.js'

import { signalifyUndefinedKey } from '../signalify.js'
import { mutable } from '../mutable.js'

import { ProxyHandlerBase } from './base.js'

/**
 * Proxy for objects. In objects, values are tracked by the
 * setter/getters in the properties.
 */
export class ProxyHandlerObject extends ProxyHandlerBase {
	// type = 'Object'

	get(target, key, proxy) {
		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.isUndefinedRead(key, true)
		}

		/** Tracking + value */
		const value = reflectGet(target, key, proxy)

		/** Proxy all functions */
		if (isFunction(value)) {
			return (...args) =>
				/**
				 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
				 *    Set.prototype.add called on incompatible receiver
				 *    #<Set>`
				 * 2. Run in a batch to react to all changes at the same time.
				 */
				batch(() => {
					if (key === 'hasOwnProperty') {
						this.has(target, args[0])
					}
					return mutable(reflectApply(value, target, args))
				})
		}

		/**
		 * A non-extensible object must return the real object, but still
		 * its children properties must be tracked
		 */
		return isExtensible(target)
			? mutable(value)
			: (mutable(value), value)
	}
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			/** New key */
			if (!(key in target)) {
				this.ownKeysWrite() // change ownKeys
				this.hasWrite(key, true) // change has
				signalifyUndefinedKey(target, key, mutable, this, value) // track value
			}
			/**
			 * To trigger the change when was read but not yet defined. It
			 * handles the cases: deleting an undefined property, setting to
			 * undefined a property that was deleted.
			 */
			this.isUndefinedWrite(key, value === undefined)

			return reflectSet(target, key, value, proxy)
		})
	}
}
