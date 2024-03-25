import { assign } from '../../std/assign.js'
import { definePropertyValueReadOnly } from '../../std/defineProperty.js'
import { empty } from '../../std/empty.js'
import { getPrototypeOf } from '../../std/getPrototypeOf.js'
import { isArray } from '../../std/isArray.js'
import { isExtensible } from '../../std/isExtensible.js'
import { isFunction } from '../../std/isFunction.js'
import { isObject } from '../../std/isObject.js'
import { iterator } from '../../std/iterator.js'
import { setPrototypeOf } from '../../std/setPrototypeOf.js'
import { weakStore } from '../../std/weakStore.js'

import { batch } from '../primitives/solid.js'

import {
	signalifyObject,
	signalifyUndefinedKey,
} from './signalify.js'
import { tracker, $track } from './tracker.js'
import { isBlacklisted } from './blacklist.js'

/** Keeps track of what objects have already been made into a proxy */
const { get: getProxy, set: setProxy } = new weakStore()

const saveProxy = (value, proxy) => {
	setProxy(value, proxy)
	if (value !== proxy) setProxy(proxy, proxy)
	return proxy
}

const ArrayPrototype = Array.prototype

/**
 * Makes a modifiable and trackeable object. Recursive. Transforms in
 * place properties into signals via get/set. Works with
 * getters/setters inherited from the immediate prototype. It only
 * affects _own_ properties (unless inherited directly from its
 * prototype), doesn't track functions.
 *
 * @template T
 * @param {GenericObject<T>} value
 * @returns {GenericObject<T>}
 */
export function mutable(value) {
	/** Return value as is when is not an object */
	if (!isObject(value)) {
		return value
	}

	/** Return proxy if already exists for value */
	let proxy = getProxy(value)
	if (proxy) {
		return proxy
	}

	/** Values like Date, RegExp, HTMLElement are not proxied */
	if (isBlacklisted(value)) {
		proxy = value
		return saveProxy(value, proxy)
	}

	if (isArray(value)) {
		/**
		 * Arrays methods are proxied by changing their prototype to be
		 * `ReactiveArray extends Array`. ReactiveArray is also proxied so
		 * functions can be batched.
		 *
		 * `ReactiveArray` may returns slices of itself. For example
		 * `array.slice()` will return a new array of class
		 * `ReactiveArray`.
		 */
		if (value instanceof ReactiveArray) {
			/**
			 * `ReactiveArray` may returns slices of itself. For example
			 * `array.slice()` will return a new array of class
			 * `ReactiveArray`. This new instance wont have a proper
			 * `tracker`
			 */
			definePropertyValueReadOnly(value, $track, tracker(value))
		} else {
			/**
			 * Make the content of the array mutable. TODO: maybe do this
			 * after saving it to the proxy. Todo check if this need to be
			 * done on other places too.
			 */
			value.forEach((_, k, value) => {
				value[k] = mutable(value[k])
			})

			/** Class MyClass extends ... extends Array {} */
			let prototype = value
			while (getPrototypeOf(prototype) !== ArrayPrototype) {
				prototype = getPrototypeOf(prototype)
			}

			const instance = new ReactiveArray()
			definePropertyValueReadOnly(instance, $track, tracker(value))

			setPrototypeOf(prototype, instance)
		}

		proxy = new Proxy(value, handlerArray)

		return saveProxy(value, proxy)
	}

	proxy = new Proxy(value, handlerObject)

	/**
	 * First save it, then signalify it in case `signalify` triggers
	 * `mutable` before we have a chance to save it as a proxy . To
	 * avoid having 2 different proxies for the same value.
	 */
	saveProxy(value, proxy)

	signalifyObject(value, mutable)

	return proxy
}

/** Proxies */

const {
	ownKeys: ReflectOwnKeys,
	has: ReflectHas,
	deleteProperty: ReflectDeleteProperty,
	getOwnPropertyDescriptor: ReflectGetOwnPropertyDescriptor,
	get: ReflectGet,
	apply: ReflectApply,
	set: ReflectSet,
} = Reflect

/* Proxy base handler */

const handlerBase = {
	proxyType: 'Base',

	ownKeys(target) {
		tracker(target).ownKeysRead()
		return ReflectOwnKeys(target)
	},
	has(target, key) {
		const r = ReflectHas(target, key)
		tracker(target).hasRead(key, r)
		return r
	},
	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		return batch(() => {
			const track = tracker(target)

			track.ownKeysWrite()
			track.delete(key)

			return ReflectDeleteProperty(target, key)
		})
	},
	getOwnPropertyDescriptor(target, key) {
		tracker(target).hasRead(key, key in target)
		return ReflectGetOwnPropertyDescriptor(target, key)
	},
}

/** Proxy handler for Objects */
const handlerObject = assign(empty(), handlerBase, {
	proxyType: 'Object',
	get(target, key, proxy) {
		/** To be able to track properties not yet set */
		if (!(key in target)) {
			tracker(target).isUndefinedRead(key, true)
		}

		/** Tracking + value */
		const value = ReflectGet(target, key, proxy)

		/** Proxy all functions */
		if (isFunction(value)) {
			return (...args) =>
				/**
				 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
				 *    Set.prototype.add called on incompatible receiver
				 *    #<Set>`
				 * 2. Run in a batch to react to all changes at the same time.
				 */
				batch(() => {
					if (key === 'hasOwnProperty') {
						this.has(target, args[0])
					}
					return ReflectApply(value, target, args)
				})
		}

		// console.log('accessing ', key, value, tracker(target).id)

		/**
		 * A non-extensible object must return the real object, but still
		 * its children properties must be tracked
		 */
		return isExtensible(target)
			? mutable(value)
			: (mutable(value), value)
	},
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			const track = tracker(target)

			/** New key */
			if (!(key in target)) {
				track.ownKeysWrite() // change ownKeys
				track.hasWrite(key, true) // change has
				signalifyUndefinedKey(target, key, mutable, track, value) // track value
			}
			/**
			 * To trigger the change when was read but not yet defined. It
			 * handles the cases: deleting an undefined property, setting to
			 * undefined a property that was deleted.
			 */
			track.isUndefinedWrite(key, value === undefined)

			return ReflectSet(target, key, value, proxy)
		})
	},
})

/** Proxy handler for Arrays */
const handlerArray = assign(empty(), handlerBase, {
	proxyType: 'Array',
	deleteProperty(target, key) {
		/** To not trigger effects when the property isn't in the object */
		if (!(key in target)) {
			return true
		}

		return batch(() => {
			const track = target[$track]

			track.ownKeysWrite()
			track.delete(key)

			track.write()

			return ReflectDeleteProperty(target, key)
		})
	},
	get(target, key, proxy) {
		const track = target[$track]

		/** To be able to track properties not yet set */
		if (!(key in target)) {
			track.isUndefinedRead(key, true)
		}

		/** Tracking + value */
		const value = ReflectGet(target, key, proxy)

		/** Proxy all functions */
		if (isFunction(value)) {
			return (...args) =>
				/**
				 * 1. `Reflect.apply` to correct `receiver`. `TypeError: Method
				 *    Set.prototype.add called on incompatible receiver
				 *    #<Set>`
				 * 2. Run in a batch to react to all changes at the same time.
				 */

				batch(() => {
					if (key === 'hasOwnProperty') {
						this.has(target, args[0])
					}
					return ReflectApply(value, target, args)
				})
		}

		// console.log('getting key', key, value, target)

		/**
		 * A non-extensible object must return the real object, but still
		 * its children properties must be tracked
		 */
		return track.valueRead(
			key,
			isExtensible(target) ? mutable(value) : (mutable(value), value),
		)
	},
	set(target, key, value, proxy) {
		return batch(() => {
			/** Always work with mutables */
			value = mutable(value)

			const track = target[$track]

			/** New key */
			if (!(key in target)) {
				track.ownKeysWrite() // change ownKeys
				track.hasWrite(key, true) // change has
			}
			/**
			 * To trigger the change when was read but not yet defined. It
			 * handles the cases: deleting an undefined property, setting to
			 * undefined a property that was deleted.
			 */
			track.isUndefinedWrite(key, value === undefined)

			if (track.valueWrite(key, value)) {
				/**
				 * Dispatch that "something" changed, for these listening for
				 * every change
				 */
				track.write()

				/**
				 * When explicit setting `length` it needs to mark anything
				 * deleted as deleted
				 */
				if (key === 'length' && value < target.length) {
					for (let k = value; k < target.length; k++) {
						track.delete(k)
					}
				}
			}

			// console.log('setting key', key, value, target)

			const r = ReflectSet(target, key, value, proxy)

			/**
			 * Always update length. `arr = [], arr[0] = true` length
			 * changed, so it needs to be updated to 1.
			 */
			track.valueWrite('length', target.length)

			return r
		})
	},
})

/**
 * Like Array but tracks.
 *
 * 1. Instances are supposed to be used Proxied, so theres no need for
 *    batching, because the proxy already batches the functions.
 */

export class ReactiveArray extends Array {
	/** @type {import('./tracker.js').Track} */
	// @ts-ignore
	[$track]

	/** Dispatch read to specific value */
	trackValueRead(k) {
		if (k in this) {
			this[$track].valueRead(k, this[k])
		}
	}

	/** Dispatch reads to values */
	trackValuesRead(start = 0, end = this.length) {
		const valueRead = this[$track].valueRead.bind(this[$track])

		start = start < 0 ? 0 : start
		end = end > this.length ? this.length : end

		for (let k = start; k < end; k++) {
			// console.log('reading', k)
			valueRead(k, this[k])
		}
	}

	/** Dispatch writes to values that changed */
	trackDiff(oldLength = this.length) {
		const track = this[$track]

		let k = 0
		for (let l = this.length; k < l; k++) {
			if (k > oldLength) {
				// it's new
				track.add(k, this[k])
			} else {
				// modify existing
				track.valueWrite(k, this[k])
			}
		}
		// delete deleted
		for (; k < oldLength; k++) {
			track.delete(k)
		}

		this[$track].write()
	}

	/** WRITE METHODS */

	// lib.es5.d.ts

	pop() {
		if (this.length) {
			const track = this[$track]

			// "something" changed
			track.write()

			// ownKeys changed
			track.ownKeysWrite()

			// has, undefined state, value
			track.delete(this.length - 1)

			// length changed
			track.valueWrite('length', this.length - 1)

			return super.pop()
		}
	}
	push(...items) {
		items = items.map(mutable)

		const track = this[$track]

		// "something" changed
		track.write()

		// ownKeys changed
		track.ownKeysWrite()

		// add keys
		for (
			let k = this.length, item = 0;
			k < this.length + items.length;
			k++, item++
		) {
			track.add(k, items[item]) // change has
		}

		// change length
		track.valueWrite('length', this.length + items.length) // change length

		return super.push(...items)
	}

	/** Removes the first element from an array and returns it. */
	shift() {
		if (this.length) {
			const track = this[$track]

			// "something" changed
			track.write()

			// ownKeys changed
			track.ownKeysWrite()

			const r = super.shift()
			this.trackDiff(this.length + 1)

			// change length
			track.valueWrite('length', this.length)

			return r
		}
	}
	/**
	 * Inserts new elements at the start of an array, and returns the
	 * new length of the array.
	 */
	unshift(...items) {
		items = items.map(mutable)

		const track = this[$track]

		// "something" changed
		track.write()

		// ownKeys changed
		track.ownKeysWrite()

		const r = super.unshift(...items)
		this.trackDiff(this.length - items.length)

		// change length
		track.valueWrite('length', this.length)

		return r
	}

	splice(start, deleteCount, ...items) {
		const track = this[$track]

		items = items.map(mutable)

		const oldLength = this.length

		const r = mutable(
			items.length
				? super.splice(start, deleteCount, ...items)
				: deleteCount !== undefined
					? super.splice(start, deleteCount)
					: super.splice(start),
		)

		track.write()

		this.trackDiff(oldLength)

		// change length
		track.valueWrite('length', this.length)

		return r
	}

	sort(compareFn) {
		const r = mutable(super.sort(compareFn))

		this[$track].write()

		this.trackDiff()

		return r
	}
	reverse() {
		const r = mutable(super.reverse())

		this[$track].write()

		this.trackDiff()

		return r
	}

	forEach(callback, thisArg) {
		this[$track].read()

		super.forEach(callback, thisArg)
	}
	map(callback, thisArg) {
		this[$track].read()

		return mutable(super.map(callback, thisArg))
	}

	every(predicate, thisArg) {
		this[$track].read()

		return super.every(predicate, thisArg)
	}
	some(predicate, thisArg) {
		this[$track].read()

		return super.some(predicate, thisArg)
	}

	// lib.es2015.core.d.ts

	fill(...args) {
		this[$track].write()

		args[0] = mutable(args[0])

		return mutable(super.fill.apply(this, args))
	}

	copyWithin(...args) {
		this[$track].write()

		return mutable(super.copyWithin.apply(this, args))
	}

	/** READ METHODS */

	// lib.es5.d.ts

	toString() {
		this[$track].read()
		return super.toString()
	}

	toLocaleString() {
		this[$track].read()
		return super.toLocaleString()
	}

	slice(start, end) {
		start = start > 0 ? start : start < 0 ? start + this.length : 0
		end = end > 0 ? end : end < 0 ? end + this.length : this.length

		this.trackValuesRead(start, end)

		return mutable(super.slice(start, end))
	}

	join(separator) {
		this[$track].read()

		return super.join(separator)
	}
	concat(...items) {
		this[$track].read()

		items = items.map(mutable)

		return mutable(super.concat(...items))
	}

	indexOf(searchElement, fromIndex) {
		const index = super.indexOf(mutable(searchElement), fromIndex)

		this.trackValueRead(index)

		return index
	}
	lastIndexOf(searchElement, fromIndex) {
		const index = super.lastIndexOf(
			mutable(searchElement),
			fromIndex === undefined ? this.length - 1 : fromIndex,
		)

		this.trackValueRead(index)

		return index
	}

	filter(predicate, thisArg) {
		this[$track].read()

		return mutable(super.filter(predicate, thisArg))
	}
	reduce(...args) {
		this[$track].read()

		return super.reduce.apply(this, args)
	}
	reduceRight(...args) {
		this[$track].read()

		return super.reduceRight.apply(this, args)
	}

	// lib.es2015.core.d.ts

	find(predicate, thisArg) {
		this[$track].read()

		return mutable(super.find(predicate, thisArg))
	}
	findIndex(predicate, thisArg) {
		this[$track].read()

		return super.findIndex(predicate, thisArg)
	}

	// lib.es2015.iterable.d.ts

	entries() {
		this[$track].read()

		return super.entries()
	}
	keys() {
		this[$track].read()

		return super.keys()
	}
	values() {
		this[$track].read()

		return super.values()
	}
	[iterator]() {
		this[$track].read()

		return super[iterator]()
	}

	// lib.es2016.array.include.d.ts

	includes(searchElement, fromIndex) {
		this[$track].read()

		return super.includes(mutable(searchElement), fromIndex)
	}

	// lib.es2019.array.d.ts

	flat(depth) {
		this[$track].read()

		return mutable(super.flat(depth))
	}
	flatMap(callback, thisArg) {
		this[$track].read()

		return mutable(super.flatMap(callback, thisArg))
	}

	// lib.es2022.array.d.ts

	at(index) {
		index = index < 0 ? index + this.length : index

		this.trackValueRead(index)

		return mutable(super.at(index))
	}

	// lib.es2023.array.d.ts

	findLast(predicate, thisArg) {
		this[$track].read()

		return mutable(super.findLast(predicate, thisArg))
	}
	findLastIndex(predicate, thisArg) {
		this[$track].read()

		return super.findLastIndex(predicate, thisArg)
	}

	toReversed() {
		this[$track].read()

		return mutable(super.toReversed())
	}
	toSorted(compare) {
		this[$track].read()

		return mutable(super.toSorted(compare))
	}
	toSpliced(start, deleteCount, ...items) {
		this[$track].read()

		items = items.map(mutable)

		return mutable(
			items.length
				? super.toSpliced(start, deleteCount, ...items)
				: deleteCount !== undefined
					? super.toSpliced(start, deleteCount)
					: super.toSpliced(start),
		)
	}
	with(index, value) {
		index = index < 0 ? index + this.length : index

		this.trackValueRead(index)

		return mutable(super.with(index, mutable(value)))
	}
}
