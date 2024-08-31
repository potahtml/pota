import { batch } from '../../reactive.js'
import { isFunction, reflectGet, reflectSet } from '../../std.js'

import { mutable } from '../mutable.js'

import { ProxyHandlerBase } from './base.js'

/** Proxy for Arrays. In Arrays, values are tracked by the proxy. */

export class ProxyHandlerArray extends ProxyHandlerBase {
	// type = 'Array'

	get(target, key, proxy) {
		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.isUndefinedRead(key, true)
		}

		/** Value */
		const value = reflectGet(target, key, proxy)

		/** Proxy all functions */
		if (isFunction(value)) {
			return this.returnFunction(target, key, value)
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
