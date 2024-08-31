import { iterator } from '../../std.js'

import { mutable } from '../mutable.js'
import { $track, $trackSlot, Track } from '../tracker.js'

/**
 * Like Map but tracks.
 *
 * 1. Instances are supposed to be used Proxied, so theres no need for
 *    batching, because the proxy already batches the functions.
 * 2. This is an internal Class and is not meant to be used outside
 *    `mutable`.
 */

export class ReactiveMap extends Map {
	/** @type {import('../tracker.js').Track} */
	[$track];

	[$trackSlot] = new Track(this)

	get size() {
		return super.size
	}

	has(key) {
		const r = super.has(key)
		this[$trackSlot].hasRead(key, r)
		return r
	}

	get(key) {
		const r = super.get(key)
		this[$trackSlot].valueRead(key, r)
		return r
	}

	set(key, value) {
		value = mutable(value)

		const slot = this[$trackSlot]

		if (super.has(key)) {
			if (super.get(key) === value) {
				return this
			}
		} else {
			slot.ownKeysWrite()
		}

		slot.write()

		slot.hasWrite(key, true)
		slot.valueWrite(key, value)

		super.set(key, value)

		this[$track].valueWrite('size', super.size)

		return this
	}
	delete(key) {
		const r = super.delete(key)
		if (r) {
			const slot = this[$trackSlot]

			slot.ownKeysWrite()
			slot.write()

			slot.hasWrite(key, false)
			slot.valueWrite(key, undefined)

			this[$track].valueWrite('size', super.size)
		}
		return r
	}
	clear() {
		if (super.size) {
			const slot = this[$trackSlot]

			slot.ownKeysWrite()
			slot.write()

			for (const key of super.keys()) {
				slot.hasWrite(key, false)
				slot.valueWrite(key, undefined)
			}

			super.clear()

			this[$track].valueWrite('size', 0)
		}
	}

	forEach(cb) {
		const slot = this[$trackSlot]

		slot.read()
		slot.ownKeysRead()

		for (const [key, value] of super.entries()) {
			slot.valueRead(key, value)
			cb(value, key, this)
		}
	}

	*keys() {
		const slot = this[$trackSlot]

		for (const key of super.keys()) {
			slot.hasRead(key, true)
			yield key
		}

		// for when empty and for when iterating all
		slot.ownKeysRead()
	}
	*values() {
		const slot = this[$trackSlot]

		for (const [key, value] of super.entries()) {
			slot.valueRead(key, value)
			yield value
		}

		// for when empty and for when iterating all
		slot.read()
		slot.ownKeysRead()
	}
	*entries() {
		const slot = this[$trackSlot]

		for (const entry of super.entries()) {
			slot.valueRead(entry[0], entry[1])
			yield entry
		}

		// for when empty and for when iterating all
		slot.read()
		slot.ownKeysRead()
	}
	[iterator]() {
		return this.entries()
	}
}
