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
 * Proxy for Sets. Per-value `has` tracking goes through `trackSlot`
 * (the shared `Track` keys the #props Map by identity). Iteration
 * (`forEach`, `values`, etc.) subscribes to the coarse
 * `valuesRead()` sentinel.
 */
export class ProxyHandlerSet extends ProxyHandlerObject {
	// type = 'Set'

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

		/** `size` needs the receiver to be the raw Set */
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
		 *    Set.prototype.add called on incompatible receiver #<Set>`
		 * 2. Run in a batch to react to all changes at the same time.
		 */
		return (...args) =>
			batch(() =>
				mutable(
					key in setMethods
						? setMethods[key](
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

const setMethods = {
	__proto__: null,

	has(handler, trackSlot, target, value, args, proxy) {
		const v = mutable(args[0])
		const r = reflectApply(value, target, [v])
		trackSlot.keyRead(v, r)
		return r
	},

	add(handler, trackSlot, target, value, args, proxy) {
		const v = mutable(args[0])

		if (target.has(v)) {
			// Already in — Set.add is a no-op semantically.
			return reflectApply(value, target, [v])
		}

		trackSlot.keyWrite(v, true)
		trackSlot.valuesWrite()

		const r = reflectApply(value, target, [v])

		handler.track.valueWrite('size', target.size)

		return r
	},

	delete(handler, trackSlot, target, value, args, proxy) {
		const v = mutable(args[0])

		const r = reflectApply(value, target, [v])
		if (r) {
			trackSlot.keyWrite(v, false)
			trackSlot.valuesWrite()
			handler.track.valueWrite('size', target.size)
		}
		return r
	},

	clear(handler, trackSlot, target, value, args, proxy) {
		if (target.size) {
			for (const v of target.values()) {
				trackSlot.keyWrite(v, false)
			}
			trackSlot.valuesWrite()
			reflectApply(value, target, args)
			handler.track.valueWrite('size', 0)
		}
	},

	forEach(handler, trackSlot, target, value, args, proxy) {
		const cb = args[0]
		const thisArg = args[1]

		trackSlot.valuesRead()

		for (const v of target.values()) {
			cb.call(thisArg, v, v, proxy)
		}
	},

	*values(handler, trackSlot, target, value, args, proxy) {
		for (const v of target.values()) {
			yield v
		}

		trackSlot.valuesRead()
	},

	*keys(handler, trackSlot, target, value, args, proxy) {
		// Set.prototype.keys === Set.prototype.values
		for (const v of target.values()) {
			yield v
		}

		trackSlot.valuesRead()
	},

	*entries(handler, trackSlot, target, value, args, proxy) {
		for (const v of target.values()) {
			yield [v, v]
		}

		trackSlot.valuesRead()
	},

	[iterator](handler, trackSlot, target, value, args, proxy) {
		return this.values(handler, trackSlot, target, value, args, proxy)
	},
}
