import { batch } from '../../reactive.js'
import { isFunction, reflectGet, reflectSet } from '../../std.js'

import { mutable } from '../mutable.js'
import { signalifyUndefinedKey } from '../signalify.js'

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
			return this.returnFunction(target, key, value)
		}

		return this.returnValue(target, key, value)
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
