import { Symbol, create, empty, is, weakStore } from '../std.js'

import { signal } from '../reactive.js'

/** Tracker */

const [getTracker, setTracker] = weakStore()

const createTracker = () => new Track()

/**
 * Returns a tracker for an object. A tracker is unique per object,
 * always the same tracker for the same object.
 *
 * @template T
 * @param {T} target
 * @returns {Track}
 */
export const tracker = target => getTracker(target, createTracker)

/** Track Class */

const equalsIs = { equals: is }
const equalsNope = { equals: false }
const equalsDefault = undefined

const Values = Symbol('Values')
const Keys = Symbol('Keys')

const Value = 'Value'
const Key = 'Key'
const isUndefined = 'isUndefined'

const kinds = {
	__proto__: null,
	[Value]: undefined,
	[Key]: undefined,
	[isUndefined]: undefined,
}

export class Track {
	// id = Date.now()

	#props = empty()

	#prop(kind, key, value, equalsType) {
		if (!(key in this.#props)) {
			this.#props[key] = create(kinds)
		}
		if (this.#props[key][kind] === undefined) {
			this.#props[key][kind] = signal(value, equalsType)
		}
		return this.#props[key][kind]
	}

	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 * @returns {any} Value
	 */
	valueRead(key, value) {
		/** Do not write to the signal here it will cause a loop */
		this.#prop(Value, key, value, equalsIs).read()

		return value
	}
	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 * @returns {boolean} Indicating if the value changed
	 */
	valueWrite(key, value) {
		/**
		 * Write the value because tracking will re-execute when this
		 * value changes
		 */
		return this.#prop(Value, key, undefined, equalsIs).write(value)
	}

	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	keyRead(key, value) {
		this.#prop(Key, key, value, equalsDefault).read()
	}
	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	keyWrite(key, value) {
		this.#prop(Key, key, value, equalsDefault).write(value)
	}

	/**
	 * Keeps track of: if value is undefined, regardless if the `key`
	 * exists in the object or not.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value
	 */
	isUndefinedRead(key, value) {
		this.#prop(isUndefined, key, value, equalsDefault).read()
	}
	/**
	 * Keeps track of: if value is undefined, regardless if the `key`
	 * exists in the object or not.
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 */
	isUndefinedWrite(key, value) {
		this.#prop(
			isUndefined,
			key,
			value === undefined,
			equalsDefault,
		).write(value === undefined)
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
		this.keyWrite(key, true) // change has
		this.isUndefinedWrite(key, value) // track when is undefined
		this.valueWrite(key, value) // change value
	}

	/**
	 * Modifies a key.
	 *
	 * 1. Sets `value`
	 * 2. Sets `undefined` state
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 */
	modify(key, value) {
		this.isUndefinedWrite(key, value) // track when is undefined

		return this.valueWrite(key, value) // change value
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
		this.keyWrite(key, false) // change has
		this.isUndefinedWrite(key, undefined) // track when is undefined
		this.valueWrite(key, undefined) // change value
	}

	/** To indicate keys have been read */
	keysRead() {
		this.#read(Keys)
	}
	/** To indicate keys have changed */
	keysWrite() {
		this.#write(Keys)
	}

	/** To indicate values have been read */
	valuesRead() {
		this.#read(Values)
	}
	/** To indicate values have changed */
	valuesWrite() {
		this.#write(Values)
	}

	/**
	 * To indicate all values have been read
	 *
	 * @param {symbol} [key]
	 */
	#read(key) {
		this.#prop(Value, key, undefined, equalsNope).read()
	}
	/**
	 * To indicate all values have changed
	 *
	 * @param {symbol} [key]
	 */
	#write(key) {
		this.#prop(Value, key, undefined, equalsNope).write()
	}
}
