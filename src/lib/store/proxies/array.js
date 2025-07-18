import { batch } from '../../reactive.js'
import {
	isFunction,
	reflectGet,
	reflectSet,
	iterator,
	reflectApply,
} from '../../std.js'

import { mutable } from '../mutable.js'

import { ProxyHandlerBase } from './base.js'

/** Proxy for Arrays. In Arrays, values are tracked by the proxy. */

export class ProxyHandlerArray extends ProxyHandlerBase {
	// type = 'Array'

	get(target, key, proxy) {
		/** To be able to track properties not yet set */
		if (!(key in target)) {
			this.track.isUndefinedRead(key, true)
		}

		const value = reflectGet(target, key, proxy)

		return isFunction(value)
			? this.returnFunction(target, key, value, proxy)
			: this.track.valueRead(
					key,
					this.returnValue(target, key, value),
				)
	}
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			/** New key */
			if (!(key in target)) {
				this.track.keysWrite() // change ownKeys
				this.track.keyWrite(key, true) // change has
				this.track.valuesWrite()
			}

			if (this.track.modify(key, value)) {
				/**
				 * Dispatch that "something" changed, for these listening for
				 * every change
				 */
				this.track.valuesWrite()

				/**
				 * When explicit setting `length` it needs to mark anything
				 * deleted as deleted
				 */
				if (key === 'length') {
					this.track.keysWrite() // change ownKeys

					if (value < target.length) {
						for (let k = value; k < target.length; k++) {
							this.track.delete(k)
						}
					}
				}
			}

			const r = reflectSet(target, key, value, proxy)

			/**
			 * Always update length. `arr = [], arr[0] = true` length
			 * changed, so it needs to be updated to 1.
			 */
			this.track.valueWrite('length', target.length)

			return r
		})
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
					key in arrayMethods
						? arrayMethods[key](this, target, value, args, proxy)
						: reflectApply(value, target, args),
				),
			)
	}

	/** special track methods for array */

	/** Dispatch read to specific key */
	trackKey(target, key) {
		if (key in target) {
			this.track.valueRead(key, target[key])
		}
	}

	/** Dispatch reads to a keys range */
	trackKeysRange(target, start = 0, end = target.length) {
		start = start < 0 ? 0 : start
		end = end > target.length ? target.length : end

		for (let key = start; key < end; key++) {
			this.track.valueRead(key, target[key])
		}
	}

	/** Dispatch writes to values that changed */
	trackDiff(target, oldLength = target.length) {
		let changed = false

		let key = 0
		for (let length = target.length; key < length; key++) {
			if (key > oldLength) {
				// it's new
				this.track.add(key, target[key])
				changed = true
			} else {
				// modify existing
				if (this.track.modify(key, target[key])) {
					changed = true
				}
			}
		}
		// delete deleted
		for (; key < oldLength; key++) {
			this.track.delete(key)
			changed = true
		}

		if (oldLength != target.length) {
			this.track.keysWrite()

			// change length
			this.track.valueWrite('length', target.length)

			changed = true
		}

		if (changed) {
			this.track.valuesWrite()
		}
	}
}

/**
 * Like Array but tracks.
 *
 * 1. Instances are supposed to be used Proxied, so theres no need for
 *    batching, because the proxy already batches the functions.
 * 2. This is an internal Class and is not meant to be used outside
 *    `mutable`.
 */

const arrayMethods = {
	__proto__: null,

	hasOwnProperty(handler, target, value, args, proxy) {
		handler.has(target, args[0])
		return reflectApply(value, target, args)
	},

	/** WRITE METHODS */

	pop(handler, target, value, args, proxy) {
		if (target.length) {
			// "something" changed
			handler.track.valuesWrite()

			// ownKeys changed
			handler.track.keysWrite()

			// has, undefined state, value
			handler.track.delete(target.length - 1)

			// length changed
			handler.track.valueWrite('length', target.length - 1)
		}
		return reflectApply(value, target, args)
	},

	// lib.es5.d.ts

	push(handler, target, value, args, proxy) {
		args = args.map(value => mutable(value))

		// "something" changed
		handler.track.valuesWrite()

		// ownKeys changed
		handler.track.keysWrite()

		// add keys
		for (
			let key = target.length, item = 0;
			key < target.length + args.length;
			key++, item++
		) {
			handler.track.add(key, args[item])
		}

		// change length
		handler.track.valueWrite('length', target.length + args.length)

		return reflectApply(value, target, args)
	},

	/** Removes the first element from an array and returns it. */
	shift(handler, target, value, args, proxy) {
		if (target.length) {
			const r = reflectApply(value, target, args)
			handler.trackDiff(target, target.length + 1)
			return r
		}
	},
	/**
	 * Inserts new elements at the start of an array, and returns the
	 * new length of the array.
	 */
	unshift(handler, target, value, args, proxy) {
		args = args.map(value => mutable(value))

		const r = reflectApply(value, target, args)

		handler.trackDiff(target, target.length - args.length)

		return r
	},

	splice(handler, target, value, args, proxy) {
		let items = args.slice(2)

		items = items.map(value => mutable(value))

		const oldLength = target.length

		const r = reflectApply(value, target, args)

		handler.trackDiff(target, oldLength)

		return r
	},

	sort(handler, target, value, args, proxy) {
		const r = reflectApply(value, target, args)

		handler.trackDiff(target)

		return r
	},
	reverse(handler, target, value, args, proxy) {
		const r = reflectApply(value, target, args)

		handler.trackDiff(target)

		return r
	},

	forEach(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		reflectApply(value, target, args)
	},
	map(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	every(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	some(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	// lib.es2015.core.d.ts

	fill(handler, target, value, args, proxy) {
		args[0] = mutable(args[0])

		const r = reflectApply(value, target, args)

		handler.trackDiff(target)

		return r
	},

	copyWithin(handler, target, value, args, proxy) {
		const r = reflectApply(value, target, args)

		handler.trackDiff(target)

		return r
	},

	/** READ METHODS */

	// lib.es5.d.ts

	toString(handler, target, value, args, proxy) {
		handler.track.valuesRead()
		return reflectApply(value, target, args)
	},

	toLocaleString(handler, target, value, args, proxy) {
		handler.track.valuesRead()
		return reflectApply(value, target, args)
	},

	slice(handler, target, value, args, proxy) {
		let start = args[0]
		let end = args[1]

		start = start > 0 ? start : start < 0 ? start + target.length : 0
		end =
			end > 0 ? end : end < 0 ? end + target.length : target.length

		const r = reflectApply(value, target, args)

		handler.trackKeysRange(target, start, end)

		return r
	},

	join(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	concat(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		args = args.map(value => mutable(value))

		return reflectApply(value, target, args)
	},

	indexOf(handler, target, value, args, proxy) {
		const searchElement = args[0]
		const fromIndex = args[1]

		const key = target.indexOf(mutable(searchElement), fromIndex)

		handler.trackKey(target, key)

		return key
	},
	lastIndexOf(handler, target, value, args, proxy) {
		const searchElement = args[0]
		const fromIndex = args[1]

		const key = target.lastIndexOf(
			mutable(searchElement),
			fromIndex === undefined ? target.length - 1 : fromIndex,
		)

		handler.trackKey(target, key)

		return key
	},

	filter(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	reduce(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	reduceRight(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	// lib.es2015.core.d.ts

	find(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	findIndex(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	// lib.es2015.iterable.d.ts

	*entries(handler, target, value, args, proxy) {
		for (const entry of target.entries()) {
			handler.track.valueRead(entry[0], entry[1])
			yield entry
		}

		// for when empty and for when iterating all
		handler.track.valuesRead()
		handler.track.keysRead()
	},
	*keys(handler, target, value, args, proxy) {
		for (const key of target.keys()) {
			handler.track.keyRead(key, true)
			yield key
		}

		// for when empty and for when iterating all
		handler.track.keysRead()
	},
	*values(handler, target, value, args, proxy) {
		for (const [key, _value] of target.entries()) {
			handler.track.valueRead(key, _value)
			yield _value
		}

		// for when empty and for when iterating all
		handler.track.valuesRead()
		handler.track.keysRead()
	},
	[iterator](handler, target, value, args, proxy) {
		return this.values(handler, target, value, args, proxy)
	},

	// lib.es2016.array.include.d.ts

	includes(handler, target, value, args, proxy) {
		handler.track.valuesRead()
		args[0] = mutable(args[0])
		return reflectApply(value, target, args)
	},

	// lib.es2019.array.d.ts

	flat(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	flatMap(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	// lib.es2022.array.d.ts

	at(handler, target, value, args, proxy) {
		let key = args[0]

		key = key < 0 ? key + target.length : key

		handler.trackKey(target, key)

		return reflectApply(value, target, args)
	},

	// lib.es2023.array.d.ts

	findLast(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	findLastIndex(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},

	toReversed(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	toSorted(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		return reflectApply(value, target, args)
	},
	toSpliced(handler, target, value, args, proxy) {
		handler.track.valuesRead()

		for (let i = 2; i < args.length; i++) {
			args[i] = mutable(args[i])
		}

		return reflectApply(value, target, args)
	},
	with(handler, target, value, args, proxy) {
		let key = args[0]

		key = key < 0 ? key + target.length : key

		handler.trackKey(target, key)

		return reflectApply(value, target, args)
	},
}
