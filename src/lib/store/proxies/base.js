import { batch } from '../../reactive.js'
import {
	isProxyValueReturnInvariant,
	reflectApply,
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
} from '../../std.js'

import { mutable } from '../mutable.js'
import { tracker } from '../tracker.js'

export class ProxyHandlerBase {
	// type = 'Base'

	constructor(value) {
		this.track = tracker(value)
	}

	ownKeys(target) {
		this.track.keysRead()
		return reflectOwnKeys(target)
	}
	has(target, key) {
		const r = reflectHas(target, key)
		this.track.keyRead(key, r)
		return r
	}
	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		return batch(() => {
			this.track.keysWrite()
			this.track.delete(key)

			/**
			 * Use `delete` instead of `reflectDeleteProperty` so it throws
			 * when not permitted
			 */
			return delete target[key]
		})
	}
	getOwnPropertyDescriptor(target, key) {
		this.has(target, key)
		return reflectGetOwnPropertyDescriptor(target, key)
	}
	returnValue(target, key, value) {
		return isProxyValueReturnInvariant(target, key, value)
			? (mutable(value), value)
			: mutable(value)
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
					key in objectMethods
						? objectMethods[key](this, target, value, args, proxy)
						: reflectApply(value, target, args),
				),
			)
	}
}

const objectMethods = {
	__proto__: null,

	hasOwnProperty(track, target, value, args, proxy) {
		track.has(target, args[0])
		return reflectApply(value, target, args)
	},
}
