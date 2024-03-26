import {
	reflectGetOwnPropertyDescriptor,
	reflectHas,
	reflectOwnKeys,
} from '../../../std/reflect.js'

import { batch } from '../../primitives/solid.js'

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
}
