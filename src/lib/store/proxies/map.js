import { $isMutable } from '../../../constants.js'
import { batch } from '../../reactive.js'
import {
	empty,
	isFunction,
	iterator,
	reflectApply,
	reflectGet,
} from '../../std.js'
import { mutable } from '../mutable.js'
import { tracker } from '../tracker.js'

import { ProxyHandlerObject } from './object.js'

/**
 * Proxy for objects. In objects, values are tracked by the
 * setter/getters in the properties.
 */
export class ProxyHandlerMap extends ProxyHandlerObject {
	// type = 'Map'

	constructor(value) {
		super(value)
		this.trackSlot = tracker(empty())
	}

	get(target, key, proxy) {
		if (key === $isMutable) {
			return true
		}

		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.track.isUndefinedRead(key, true)
		}

		/** Tracking + value
		 * For whatever reason `size` is special for `Map`
		 */

		const value =
			key === 'size'
				? this.track.valueRead(key, reflectGet(target, key, target))
				: reflectGet(target, key, proxy)

		return isFunction(value)
			? this.returnFunction(target, key, value, proxy)
			: this.returnValue(target, key, value)
	}
	returnFunction(target, key, value, proxy) {
		/**
		 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
		 *    Set.prototype.add called on incompatible receiver #<Set>`
		 * 2. Run in a batch to react to all changes at the same time.
		 */
		return (...args) =>
			batch(() =>
				mutable(
					key in mapMethods
						? mapMethods[key](
								this,
								this.trackSlot,
								target,
								value,
								args,
								proxy,
							)
						: reflectApply(value, target, args),
				),
			)
	}
}

/**
 * Like Map but tracks.
 *
 * 1. Instances are supposed to be used Proxied, so theres no need for
 *    batching, because the proxy already batches the functions.
 * 2. This is an internal Class and is not meant to be used outside
 *    `mutable`.
 */

const mapMethods = {
	__proto__: null,

	has(handler, trackSlot, target, value, args, proxy) {
		const key = args[0]

		const r = reflectApply(value, target, args)
		trackSlot.keyRead(key, r)
		return r
	},
	get(handler, trackSlot, target, value, args, proxy) {
		const key = args[0]

		const r = reflectApply(value, target, args)
		trackSlot.valueRead(key, r)
		return r
	},

	set(handler, trackSlot, target, value, args, proxy) {
		const key = args[0]
		const val = mutable(args[1])

		if (target.has(key)) {
			if (target.get(key) === val) {
				return reflectApply(value, target, args)
			}
		} else {
			trackSlot.keysWrite()
		}

		trackSlot.valuesWrite()

		trackSlot.keyWrite(key, true)
		trackSlot.valueWrite(key, val)

		const r = reflectApply(value, target, args)

		handler.track.valueWrite('size', target.size)

		return r
	},
	delete(handler, trackSlot, target, value, args, proxy) {
		const key = args[0]

		const r = reflectApply(value, target, args)
		if (r) {
			trackSlot.keysWrite()
			trackSlot.valuesWrite()

			trackSlot.keyWrite(key, false)
			trackSlot.valueWrite(key, undefined)

			handler.track.valueWrite('size', target.size)
		}
		return r
	},
	clear(handler, trackSlot, target, value, args, proxy) {
		if (target.size) {
			trackSlot.keysWrite()
			trackSlot.valuesWrite()

			for (const key of target.keys()) {
				trackSlot.keyWrite(key, false)
				trackSlot.valueWrite(key, undefined)
			}

			reflectApply(value, target, args)

			handler.track.valueWrite('size', 0)
		}
	},

	forEach(handler, trackSlot, target, value, args, proxy) {
		const cb = args[0]

		trackSlot.valuesRead()
		trackSlot.keysRead()

		for (const [key, value] of target.entries()) {
			trackSlot.valueRead(key, value)
			cb(value, key, proxy)
		}
	},
	*keys(handler, trackSlot, target, value, args, proxy) {
		for (const key of target.keys()) {
			trackSlot.keyRead(key, true)
			yield key
		}

		// for when empty and for when iterating all
		trackSlot.keysRead()
	},
	*values(handler, trackSlot, target, value, args, proxy) {
		for (const [key, value] of target.entries()) {
			trackSlot.valueRead(key, value)
			yield value
		}

		// for when empty and for when iterating all
		trackSlot.valuesRead()
		trackSlot.keysRead()
	},
	*entries(handler, trackSlot, target, value, args, proxy) {
		for (const entry of target.entries()) {
			trackSlot.valueRead(entry[0], entry[1])
			yield entry
		}

		// for when empty and for when iterating all
		trackSlot.valuesRead()
		trackSlot.keysRead()
	},
	[iterator](handler, trackSlot, target, value, args, proxy) {
		return this.entries(
			handler,
			trackSlot,
			target,
			value,
			args,
			proxy,
		)
	},
}
