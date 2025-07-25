import { $isMutable } from '../../../constants.js'
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
		if (key === $isMutable) {
			return true
		}

		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.track.isUndefinedRead(key, true)
		}

		const value = reflectGet(target, key, proxy)

		return isFunction(value)
			? this.returnFunction(target, key, value, proxy)
			: this.returnValue(target, key, value)
	}
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			/** New key */
			if (!(key in target)) {
				this.track.keysWrite() // change ownKeys
				this.track.keyWrite(key, true) // change has
				signalifyUndefinedKey(target, key, mutable, this.track, value) // track value
			}
			/**
			 * To trigger the change when was read but not yet defined. It
			 * handles the cases: deleting an undefined property, setting to
			 * undefined a property that was deleted.
			 */
			this.track.isUndefinedWrite(key, value)

			return reflectSet(target, key, value, proxy)
		})
	}
}
