import {
	reflectApply,
	reflectGet,
	reflectSet,
} from '../../../std/reflect.js'
import { isFunction } from '../../../std/isFunction.js'

import { batch } from '../../primitives/solid.js'

import { mutable } from '../mutable.js'
import { ProxyHandlerBase } from './base.js'

/** Proxy for Arrays. In Arrays, values are tracked by the proxy. */

export class ProxyHandlerArray extends ProxyHandlerBase {
	// type = 'Array'

	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		return batch(() => {
			this.ownKeysWrite()
			this.delete(key)

			this.write()

			/**
			 * Use `delete` instead of `reflectDeleteProperty` so it throws
			 * when not permitted
			 */

			return delete target[key]
		})
	}
	get(target, key, proxy) {
		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.isUndefinedRead(key, true)
		}

		/** Value */
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

		return this.valueRead(key, this.returnValue(target, key, value))
	}
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			/** New key */
			if (!(key in target)) {
				this.ownKeysWrite() // change ownKeys
				this.hasWrite(key, true) // change has
				this.write()
			}

			if (this.modify(key, value)) {
				/**
				 * Dispatch that "something" changed, for these listening for
				 * every change
				 */
				this.write()

				/**
				 * When explicit setting `length` it needs to mark anything
				 * deleted as deleted
				 */
				if (key === 'length') {
					this.ownKeysWrite() // change ownKeys

					if (value < target.length) {
						for (let k = value; k < target.length; k++) {
							this.delete(k)
						}
					}
				}
			}

			const r = reflectSet(target, key, value, proxy)

			/**
			 * Always update length. `arr = [], arr[0] = true` length
			 * changed, so it needs to be updated to 1.
			 */
			this.valueWrite('length', target.length)

			return r
		})
	}
}
