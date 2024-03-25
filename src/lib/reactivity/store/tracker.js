import { create } from '../../std/create.js'
import { empty } from '../../std/empty.js'
import { is } from '../../std/is.js'
import { isFunction } from '../../std/isFunction.js'
import { Symbol } from '../../std/Symbol.js'
import { weakStore } from '../../std/weakStore.js'

import { signal } from '../primitives/solid.js'

/** Tracker */

export const $track = Symbol()

const { get: getTracker } = weakStore()

const createTracker = () => new Track()

/**
 * Returns a tracker for an object. A tracker is unique per object,
 * always the same tracker for the same object.
 *
 * @param {Object} target
 * @returns {Track}
 */
export const tracker = target => getTracker(target, createTracker)

export function trackerValueSignal(target, track, key) {
	track = track || tracker(target)
	return [
		track.valueRead.bind(track, key),
		track.valueWrite.bind(track, key),
	]
}

/** Track Class */

const handleNaN = { equals: is }
const notEquals = { equals: false }

function signals(property, type, value, equalsType) {
	if (property[type] === undefined) {
		property[type] = signal(
			value,
			equalsType === 1 && typeof value === 'number'
				? handleNaN
				: equalsType === 2
					? notEquals
					: null,
		)
	}
	return property[type]
}

const All = Symbol()
const OwnKeys = Symbol()

const Value = '1'
const Has = '2'
const isUndefined = '3'

const defaults = {
	__proto__: null,
	[Value]: undefined,
	[Has]: undefined,
	[isUndefined]: undefined,
}

export class Track {
	#props = empty()

	// #id = Math.random()

	#prop(key) {
		if (!(key in this.#props)) {
			this.#props[key] = create(defaults)
		}
		return this.#props[key]
	}

	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 */
	valueRead(key, value) {
		/** Do not write to the signal here it will cause a loop */
		const signal = signals(this.#prop(key), Value, value, 1)
		signal[2] = value
		return signal[0](), value
	}
	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 */
	valueWrite(key, value) {
		/**
		 * Write the value because tracking will re-execute when this
		 * value changes
		 */
		const signal = signals(this.#prop(key), Value, value, 1)
		const changed = signal[2] !== value
		signal[2] = value
		signal[1](isFunction(value) ? () => value : value)
		return changed
	}

	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	hasRead(key, value) {
		signals(this.#prop(key), Has, value, 0)[0]()
	}
	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	hasWrite(key, value) {
		signals(this.#prop(key), Has, value, 0)[1](value)
	}

	/**
	 * Keeps track of: if value is undefined, regardless if the `key`
	 * exists in the object or not.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is
	 *   `undefined`
	 */
	isUndefinedRead(key, value) {
		signals(this.#prop(key), isUndefined, value, 0)[0]()
	}
	/**
	 * Keeps track of: if value is undefined, regardless if the `key`
	 * exists in the object or not.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is
	 *   `undefined`
	 */
	isUndefinedWrite(key, value) {
		signals(this.#prop(key), isUndefined, value, 0)[1](value)
	}

	/**
	 * Adds a key.
	 *
	 * 1. Sets `has` state to `true`
	 * 2. Sets `undefined` state
	 * 3. Sets `value`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 */
	add(key, value) {
		this.hasWrite(key, true) // change has
		this.isUndefinedWrite(key, value === undefined) // track when is undefined
		this.valueWrite(key, value) // change value
	}

	/**
	 * Deletes a key.
	 *
	 * 1. Sets `has` state to `false`
	 * 2. Sets `undefined` state to true
	 * 3. Sets `value` to `undefined`
	 *
	 * @param {PropertyKey} key
	 */
	delete(key) {
		this.hasWrite(key, false) // change has
		this.isUndefinedWrite(key, true) // track when is undefined
		this.valueWrite(key, undefined) // change value
	}

	/**
	 * Internal - read/write for using exclusively with Symbols by
	 * reusing the "Value" slot
	 */

	#read(key) {
		signals(this.#prop(key), Value, undefined, 2)[0]()
	}
	#write(key) {
		signals(this.#prop(key), Value, undefined, 2)[1]()
	}

	// single signal

	/** `ownKeys` read */
	ownKeysRead() {
		this.#read(OwnKeys)
	}
	/** To indicate keys have change */
	ownKeysWrite() {
		this.#write(OwnKeys)
	}

	/** To indicate all values have been read */
	read() {
		this.#read(All)
	}
	/** To indicate all value have changed */
	write() {
		this.#write(All)
	}
}
