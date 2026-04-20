import { $isMutable } from '../../../constants.js'
import { batch } from '../../reactive.js'
import {
	isFunction,
	iterator,
	reflectApply,
	reflectGet,
} from '../../std.js'
import { mutable } from '../mutable.js'
import { Track } from '../tracker.js'

import { ProxyHandlerObject } from './object.js'

/**
 * Proxy for Maps. Per-key `has` / `get` tracking goes through
 * `trackSlot` (the shared `Track` keys the #props Map by identity,
 * so object keys are tracked precisely). Iteration methods
 * (`forEach`, `keys`, `values`, `entries`) subscribe to the coarse
 * `valuesRead` / `keysRead` sentinels, plus per-key subscriptions at
 * each yield so partial iteration via `break` remains reactive.
 */
export class ProxyHandlerMap extends ProxyHandlerObject {
	// type = 'Map'

	constructor(value) {
		super(value)
		this.trackSlot = new Track(true)
	}

	get(target, key, proxy) {
		if (key === $isMutable) {
			return true
		}

		if (this.isIdentityKey(key)) {
			return reflectGet(target, key, proxy)
		}

		const shouldTrack = this.shouldTrackKey(key)

		/** To be able to track properties not yet set */
		if (shouldTrack && !(key in target)) {
			this.track.isUndefinedRead(key, true)
		}

		/** `size` needs the receiver to be the raw Map */
		const value =
			shouldTrack && key === 'size'
				? this.track.valueRead(key, reflectGet(target, key, target))
				: reflectGet(target, key, proxy)

		return isFunction(value)
			? this.returnFunction(target, key, value, proxy)
			: this.returnValue(target, key, value)
	}

	returnFunction(target, key, value, proxy) {
		/**
		 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
		 *    Map.prototype.set called on incompatible receiver #<Map>`
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
		const thisArg = args[1]

		trackSlot.valuesRead()
		trackSlot.keysRead()

		for (const [key, value] of target.entries()) {
			trackSlot.valueRead(key, value)
			cb.call(thisArg, value, key, proxy)
		}
	},

	*keys(handler, trackSlot, target, value, args, proxy) {
		for (const key of target.keys()) {
			trackSlot.keyRead(key, true)
			yield key
		}
		// covers "iterated to completion" and "iterated empty"; partial
		// iteration with `break` relies on per-key subscriptions above.
		trackSlot.keysRead()
	},

	*values(handler, trackSlot, target, value, args, proxy) {
		for (const [key, value] of target.entries()) {
			trackSlot.valueRead(key, value)
			yield value
		}
		trackSlot.valuesRead()
		trackSlot.keysRead()
	},

	*entries(handler, trackSlot, target, value, args, proxy) {
		for (const entry of target.entries()) {
			trackSlot.valueRead(entry[0], entry[1])
			yield entry
		}
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
