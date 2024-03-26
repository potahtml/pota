import { iterator } from '../../../std/iterator.js'

import { mutable } from '../mutable.js'
import { $track } from '../tracker.js'

/**
 * Like Array but tracks.
 *
 * 1. Instances are supposed to be used Proxied, so theres no need for
 *    batching, because the proxy already batches the functions.
 * 2. This is an internal Class and is not meant to be used outside
 *    `mutable`.
 */

export class ReactiveArray extends Array {
	/** @type {import('../tracker.js').Track} */
	[$track]

	/** Dispatch read to specific key */
	trackKey(k) {
		if (k in this) {
			this[$track].valueRead(k, this[k])
		}
	}

	/** Dispatch reads to a keys range */
	trackKeysRange(start = 0, end = this.length) {
		const track = this[$track]

		start = start < 0 ? 0 : start
		end = end > this.length ? this.length : end

		for (let k = start; k < end; k++) {
			// console.log('reading', k)
			track.valueRead(k, this[k])
		}
	}

	/** Dispatch writes to values that changed */
	trackDiff(oldLength = this.length) {
		const track = this[$track]

		let changed = false

		let k = 0
		for (let l = this.length; k < l; k++) {
			if (k > oldLength) {
				// it's new
				track.add(k, this[k])
				changed = true
			} else {
				// modify existing
				if (track.modify(k, this[k])) {
					changed = true
				}
			}
		}
		// delete deleted
		for (; k < oldLength; k++) {
			track.delete(k)
			changed = true
		}

		if (oldLength != this.length) {
			track.ownKeysWrite()

			// change length
			track.valueWrite('length', this.length)

			changed = true
		}

		if (changed) {
			track.write()
		}
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
			track.add(k, items[item])
		}

		// change length
		track.valueWrite('length', this.length + items.length)

		return super.push(...items)
	}

	/** Removes the first element from an array and returns it. */
	shift() {
		if (this.length) {
			const r = super.shift()
			this.trackDiff(this.length + 1)
			return r
		}
	}
	/**
	 * Inserts new elements at the start of an array, and returns the
	 * new length of the array.
	 */
	unshift(...items) {
		items = items.map(mutable)

		const r = super.unshift(...items)
		this.trackDiff(this.length - items.length)

		return r
	}

	splice(start, deleteCount, ...items) {
		items = items.map(mutable)

		const oldLength = this.length

		const r = items.length
			? super.splice(start, deleteCount, ...items)
			: deleteCount !== undefined
				? super.splice(start, deleteCount)
				: super.splice(start)

		this.trackDiff(oldLength)

		return r
	}

	// @ts-ignore
	sort(compareFn) {
		const r = super.sort(compareFn)

		this.trackDiff()

		return r
	}
	reverse() {
		const r = super.reverse()

		this.trackDiff()

		return r
	}

	forEach(callback, thisArg) {
		this[$track].read()

		super.forEach(callback, thisArg)
	}
	map(callback, thisArg) {
		this[$track].read()

		return super.map(callback, thisArg)
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
		args[0] = mutable(args[0])

		// @ts-ignore
		const r = super.fill.apply(this, args)

		this.trackDiff()

		return r
	}

	copyWithin(...args) {
		// @ts-ignore
		const r = super.copyWithin.apply(this, args)

		this.trackDiff()

		return r
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

		this.trackKeysRange(start, end)

		return super.slice(start, end)
	}

	join(separator) {
		this[$track].read()

		return super.join(separator)
	}
	concat(...items) {
		this[$track].read()

		items = items.map(mutable)

		return super.concat(...items)
	}

	indexOf(searchElement, fromIndex) {
		const k = super.indexOf(mutable(searchElement), fromIndex)

		this.trackKey(k)

		return k
	}
	lastIndexOf(searchElement, fromIndex) {
		const k = super.lastIndexOf(
			mutable(searchElement),
			fromIndex === undefined ? this.length - 1 : fromIndex,
		)

		this.trackKey(k)

		return k
	}

	filter(predicate, thisArg) {
		this[$track].read()

		return super.filter(predicate, thisArg)
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

		return super.find(predicate, thisArg)
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

		return super.flat(depth)
	}
	flatMap(callback, thisArg) {
		this[$track].read()

		return super.flatMap(callback, thisArg)
	}

	// lib.es2022.array.d.ts

	at(index) {
		index = index < 0 ? index + this.length : index

		this.trackKey(index)

		return super.at(index)
	}

	// lib.es2023.array.d.ts

	findLast(predicate, thisArg) {
		this[$track].read()

		return super.findLast(predicate, thisArg)
	}
	findLastIndex(predicate, thisArg) {
		this[$track].read()

		return super.findLastIndex(predicate, thisArg)
	}

	toReversed() {
		this[$track].read()

		return super.toReversed()
	}
	toSorted(compare) {
		this[$track].read()

		return super.toSorted(compare)
	}
	toSpliced(start, deleteCount, ...items) {
		this[$track].read()

		items = items.map(mutable)

		return items.length
			? super.toSpliced(start, deleteCount, ...items)
			: deleteCount !== undefined
				? super.toSpliced(start, deleteCount)
				: super.toSpliced(start)
	}
	with(index, value) {
		index = index < 0 ? index + this.length : index

		this.trackKey(index)

		return super.with(index, mutable(value))
	}
}
