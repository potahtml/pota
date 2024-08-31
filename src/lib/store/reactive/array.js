import { iterator } from '../../std.js'

import { mutable } from '../mutable.js'
import { $track } from '../tracker.js'

/** Dispatch read to specific key */
function trackKey(target, key) {
	if (key in target) {
		target[$track].valueRead(key, target[key])
	}
}

/** Dispatch reads to a keys range */
function trackKeysRange(target, start = 0, end = target.length) {
	const track = target[$track]

	start = start < 0 ? 0 : start
	end = end > target.length ? target.length : end

	for (let key = start; key < end; key++) {
		// console.log('reading', key)
		track.valueRead(key, target[key])
	}
}

/** Dispatch writes to values that changed */
function trackDiff(target, oldLength = target.length) {
	const track = target[$track]

	let changed = false

	let key = 0
	for (let length = target.length; key < length; key++) {
		if (key > oldLength) {
			// it's new
			track.add(key, target[key])
			changed = true
		} else {
			// modify existing
			if (track.modify(key, target[key])) {
				changed = true
			}
		}
	}
	// delete deleted
	for (; key < oldLength; key++) {
		track.delete(key)
		changed = true
	}

	if (oldLength != target.length) {
		track.ownKeysWrite()

		// change length
		track.valueWrite('length', target.length)

		changed = true
	}

	if (changed) {
		track.write()
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

export class ReactiveArray extends Array {
	/** @type {import('../tracker.js').Track} */
	[$track]

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
			let key = this.length, item = 0;
			key < this.length + items.length;
			key++, item++
		) {
			track.add(key, items[item])
		}

		// change length
		track.valueWrite('length', this.length + items.length)

		return super.push(...items)
	}

	/** Removes the first element from an array and returns it. */
	shift() {
		if (this.length) {
			const r = super.shift()
			trackDiff(this, this.length + 1)
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
		trackDiff(this, this.length - items.length)

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

		trackDiff(this, oldLength)

		return r
	}

	// @ts-ignore
	sort(compareFn) {
		const r = super.sort(compareFn)

		trackDiff(this)

		return r
	}
	reverse() {
		const r = super.reverse()

		trackDiff(this)

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

		trackDiff(this)

		return r
	}

	copyWithin(...args) {
		// @ts-ignore
		const r = super.copyWithin.apply(this, args)

		trackDiff(this)

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

		trackKeysRange(this, start, end)

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
		const key = super.indexOf(mutable(searchElement), fromIndex)

		trackKey(this, key)

		return key
	}
	lastIndexOf(searchElement, fromIndex) {
		const key = super.lastIndexOf(
			mutable(searchElement),
			fromIndex === undefined ? this.length - 1 : fromIndex,
		)

		trackKey(this, key)

		return key
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

	*entries() {
		const track = this[$track]

		for (const entry of super.entries()) {
			track.valueRead(entry[0], entry[1])
			yield entry
		}

		// for when empty and for when iterating all
		track.read()
		track.ownKeysRead()
	}
	*keys() {
		const track = this[$track]

		for (const key of super.keys()) {
			track.hasRead(key, true)
			yield key
		}

		// for when empty and for when iterating all
		track.ownKeysRead()
	}
	*values() {
		const track = this[$track]

		for (const [key, value] of super.entries()) {
			track.valueRead(key, value)
			yield value
		}

		// for when empty and for when iterating all
		track.read()
		track.ownKeysRead()
	}
	[iterator]() {
		return this.values()
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

	at(key) {
		key = key < 0 ? key + this.length : key

		trackKey(this, key)

		return super.at(key)
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
	with(key, value) {
		key = key < 0 ? key + this.length : key

		trackKey(this, key)

		return super.with(key, mutable(value))
	}
}
