import { Symbol, create, empty, is, weakStore } from '../std.js'

import { signal } from '../reactive.js'

/** Tracker */

const [getTracker] = weakStore()

const createTracker = () => new Track(false)

/**
 * Returns a tracker for an object. A tracker is unique per object,
 * always the same tracker for the same object. Uses null-proto
 * object storage — number keys coerce to strings (matches array
 * index semantics).
 *
 * For handler-private trackers that need identity-keyed storage
 * (Map/Set per-key reactivity), instantiate directly via
 * `new Track(true)`.
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
const Getter = 'Getter'

const kinds = {
	__proto__: null,
	[Value]: undefined,
	[Key]: undefined,
	[isUndefined]: undefined,
	[Getter]: undefined,
}

/**
 * Track class — per-key reactive signal store.
 *
 * Use the `tracker(target)` factory for trackers memoized per target
 * (typical case: main proxy tracker). Instantiate directly via
 * `new Track(identity)` when the tracker is handler-private and
 * should NOT be memoized — e.g. Map/Set's `trackSlot`.
 */
export class Track {
	// id = Date.now()

	/**
	 * Per-key signal storage.
	 *
	 * - Default (`isIdentity=false`): null-proto object. Numbers
	 *   auto-coerce to strings, matching array index semantics.
	 * - Identity (`isIdentity=true`): `Map`. Keys preserved by
	 *   identity — required for Map/Set where object keys,
	 *   number-vs-string, and boolean-vs-string distinctions matter.
	 */
	#props
	isIdentity

	constructor(identity) {
		this.isIdentity = !!identity
		this.#props = identity ? new Map() : empty()
	}

	#prop(kind, key, value, equalsType) {
		let entry
		if (this.isIdentity) {
			entry = this.#props.get(key)
			if (!entry) {
				entry = create(kinds)
				this.#props.set(key, entry)
			}
		} else {
			if (!(key in this.#props)) {
				this.#props[key] = create(kinds)
			}
			entry = this.#props[key]
		}
		if (entry[kind] === undefined) {
			entry[kind] = signal(value, equalsType)
		}
		return entry[kind]
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
	 * Keeps track of: the getter function identity for an accessor
	 * `key`. Subscribers are effects reading through a signalified
	 * accessor wrapper; the signal fires when `defineProperty` swaps in
	 * a getter with a different identity.
	 *
	 * @param {PropertyKey} key
	 * @param {any} value - The getter function
	 */
	getterRead(key, value) {
		this.#prop(Getter, key, value, equalsDefault).read()
	}
	/**
	 * Writes the getter function identity for `key`.
	 *
	 * @param {PropertyKey} key
	 * @param {any} value - The getter function
	 */
	getterWrite(key, value) {
		return this.#prop(Getter, key, undefined, equalsDefault).write(
			value,
		)
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
