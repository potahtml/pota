import { batch } from '../../reactive.js'
import {
	isProxyValueReturnInvariant,
	reflectApply,
	reflectDefineProperty,
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
} from '../../std.js'

import { isKeyBlacklisted } from '../blacklist.js'
import { mutable } from '../mutable.js'
import { signalifyKey, unwrapGetSet } from '../signalify.js'
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
		if (this.shouldTrackKey(key)) this.track.keyRead(key, r)
		return r
	}
	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		if (!this.shouldTrackKey(key)) return delete target[key]

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
		const desc = reflectGetOwnPropertyDescriptor(target, key)
		if (desc) {
			// Return the user's original get/set — never expose our
			// signalify wrappers through a standard descriptor read.
			if (desc.get) desc.get = unwrapGetSet(desc.get)
			if (desc.set) desc.set = unwrapGetSet(desc.set)
		}
		return desc
	}
	defineProperty(target, key, descriptor) {
		if (!this.shouldTrackKey(key)) {
			return reflectDefineProperty(target, key, descriptor)
		}

		return batch(() => {
			const wasIn = key in target
			const oldDesc = wasIn
				? reflectGetOwnPropertyDescriptor(target, key)
				: undefined

			const r = reflectDefineProperty(target, key, descriptor)
			if (r) {
				const newDesc = reflectGetOwnPropertyDescriptor(target, key)
				const oldEnum = oldDesc ? oldDesc.enumerable : false
				const newEnum = newDesc ? newDesc.enumerable : false

				if (!wasIn) {
					this.track.keyWrite(key, true) // has changed
					if (newEnum) this.track.keysWrite() // added to ownKeys
				} else if (oldEnum !== newEnum) {
					this.track.keysWrite() // enumerability transitioned
				}

				// Wrap for per-key reactivity. Handles both data and
				// accessor descriptors; skips internally for
				// non-configurable and for blacklisted keys. Pass the
				// effective (merged) descriptor so accessor overrides
				// see retained get/set from the original.
				signalifyKey(target, key, newDesc, mutable, this.track)

				// Gate `valuesWrite()` on whether anything actually
				// changed — otherwise same-value redefines wake
				// `forEach`-style `valuesRead` subscribers unnecessarily.
				let changed = !wasIn
				if ('value' in newDesc) {
					// Data descriptor — effective value is newDesc.value.
					// shall NOT run getters.
					const newValue = mutable(newDesc.value)
					this.track.isUndefinedWrite(key, newValue)
					if (this.track.valueWrite(key, newValue)) changed = true
				} else {
					// Accessor descriptor — `signalifyKey` updates the
					// per-key `Getter` signal above, so same-identity
					// redefines are absorbed and real getter swaps fire
					// subscribers. We only need to flip `isUndefined`
					// for newly-added keys so effects that read the
					// key while undefined wake up; existing keys
					// already have `isUndefined` = false.
					if (!wasIn) {
						this.track.isUndefinedWrite(key, null)
					}
				}
				if (changed) this.track.valuesWrite()
			}
			return r
		})
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
	/**
	 * `true` when reactive tracking should run for `key`. Skips
	 * engine-internal keys (well-known symbols, `constructor`,
	 * `__proto__`) so they don't create spurious subscriptions.
	 *
	 * @param {PropertyKey} key
	 * @returns {boolean}
	 */
	shouldTrackKey(key) {
		return !isKeyBlacklisted(key)
	}
	/**
	 * `true` when `key` is an identity-sensitive blacklisted key. The
	 * get trap returns the raw value for these so `obj.constructor ===
	 * Object` and `obj.__proto__ === Object.prototype` hold. Other
	 * blacklisted keys (well-known symbols) still go through
	 * `returnFunction` so internal-slot methods like
	 * `Map.prototype[Symbol.iterator]` receive the raw target as
	 * receiver.
	 *
	 * @param {PropertyKey} key
	 * @returns {boolean}
	 */
	isIdentityKey(key) {
		return key === 'constructor' || key === '__proto__'
	}
}

const objectMethods = {
	__proto__: null,

	hasOwnProperty(track, target, value, args, proxy) {
		track.has(target, args[0])
		return reflectApply(value, target, args)
	},
}
