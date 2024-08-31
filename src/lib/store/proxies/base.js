import { batch } from '../../reactive.js'
import {
	isConfigurable,
	isExtensible,
	reflectApply,
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
} from '../../std.js'

import { mutable } from '../mutable.js'
import { Track } from '../tracker.js'

export class ProxyHandlerBase extends Track {
	// type = 'Base'

	ownKeys(target) {
		this.ownKeysRead()
		return reflectOwnKeys(target)
	}
	has(target, key) {
		const r = reflectHas(target, key)
		this.hasRead(key, r)
		return r
	}
	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		return batch(() => {
			this.ownKeysWrite()
			this.delete(key)

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
		/**
		 * 1. A non-extensible object must return the real object, but still
		 *    its children properties must be tracked
		 * 2. A non-configurable property must return the real value
		 *
		 * [[Get]] For proxy objects enforces the following invariants:
		 *
		 * The value reported for a property must be the same as the value
		 * of the corresponding target object property if the target
		 * object property is a non-writable, non-configurable own data
		 * property.
		 *
		 * The value reported for a property must be undefined if the
		 * corresponding target object property is a non-configurable own
		 * accessor property that has undefined as its [[Get]] attribute.
		 */

		return !isExtensible(target) ||
			!isConfigurable(target, key, value)
			? (mutable(value), value)
			: mutable(value)
	}
	returnFunction(target, key, value) {
		return (...args) =>
			/**
			 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
			 *    Set.prototype.add called on incompatible receiver #<Set>`
			 * 2. Run in a batch to react to all changes at the same time.
			 */

			batch(() => {
				if (key === 'hasOwnProperty') {
					this.has(target, args[0])
				}
				return mutable(reflectApply(value, target, args))
			})
	}
}
