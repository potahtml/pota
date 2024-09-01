import { Symbol, create, empty, is, weakStore } from '../std.js'

import { signal } from '../reactive.js'

/** @type symbol */
export const $track = Symbol('track')
/** @type symbol */
export const $trackSlot = Symbol('track-slot')

/** Tracker */

const [getTracker, setTracker] = weakStore()

const createTracker = target => new Track(target, true)

/**
 * Returns a tracker for an object. A tracker is unique per object,
 * always the same tracker for the same object.
 *
 * @template T
 * @param {T} target
 * @returns {Track}
 */
export const tracker = target => getTracker(target, createTracker)

/**
 * Returns the signal tracking the value.
 *
 * @template T
 * @param {T} target
 * @param {Track} track
 * @param {PropertyKey} key
 * @returns {[(newValue) => any, (newValue) => boolean]}
 */
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

function signals(property, key, type, value, equalsType) {
	if (property[type] === undefined) {
		/*
		log(
			{
				id() {
					return ''
				},
			},
			'creating signal',
			key,
			type,
			value,
		)
		*/

		property[type] = signal(
			value,
			equalsType === 1 && typeof value === 'number'
				? handleNaN
				: equalsType === 2
					? notEquals
					: undefined,
		)
	}
	return property[type]
}

const All = Symbol('All')
const OwnKeys = Symbol('OwnKeys')

const Value = Symbol('Value')
const Has = Symbol('Has')
const isUndefined = Symbol('isUndefined')

const defaults = {
	__proto__: null,
	[Value]: undefined,
	[Has]: undefined,
	[isUndefined]: undefined,
}

function log(track, ...args) {
	console.log(track.id(), ...args)
}

export class Track {
	#props = empty()

	/*
	#id = Math.random()

	id() {
		return this.#id
	}
	*/

	/**
	 * @param {object} value
	 * @param {boolean} [isNew]
	 */
	constructor(value, isNew) {
		if (!isNew) {
			/**
			 * An object will already have a tracker when the tracker is
			 * created outside of mutable. Outside of the proxy handlers.
			 */
			const tracker = getTracker(value)
			if (tracker) {
				this.#props = tracker.#props
			} else {
				setTracker(value, this)
			}
		}
	}

	#prop(key) {
		if (!(key in this.#props)) {
			this.#props[key] = create(defaults)
		}
		return this.#props[key]
	}

	/**
	 * Return true if the signals has already been created
	 *
	 * @returns {boolean}
	 */
	#hasSignal(propKey, valueKey) {
		return (
			propKey in this.#props &&
			valueKey in this.#props[propKey] &&
			this.#props[propKey][valueKey] !== undefined
		)
	}

	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 * @returns {any} Value
	 */
	valueRead(key, value) {
		// log(this, 'valueRead', key, value)

		/** Do not write to the signal here it will cause a loop */
		const signal = signals(this.#prop(key), key, Value, value, 1)
		return signal.read(), value
	}
	/**
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 * @returns {boolean} Indicating if the value changed
	 */
	valueWrite(key, value) {
		// log(this, 'valueWrite', key, value)

		const hasSignal = this.#hasSignal(key, Value)
		/*
		log(
			this,
			'has signal',
			hasSignal,
			this.#props[key] ? this.#props[key][Value] : undefined,
		)
		*/
		/**
		 * Write the value because tracking will re-execute when this
		 * value changes
		 */
		const signal = signals(this.#prop(key), key, Value, value, 1)
		const changed = signal.write(value) || !hasSignal

		// log(this, 'valueWrite changed?', changed)
		return changed
	}

	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	hasRead(key, value) {
		// log(this, 'hasRead', key, value)

		signals(this.#prop(key), key, Has, value, 0).read()
	}
	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	hasWrite(key, value) {
		// log(this, 'hasWrite', key, value)

		signals(this.#prop(key), key, Has, value, 0).write(value)
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
		// log(this, 'isUndefinedRead', key, value)

		signals(this.#prop(key), key, isUndefined, value, 0).read()
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
		// log(this, 'isUndefinedWrite', key, value)

		signals(this.#prop(key), key, isUndefined, value, 0).write(value)
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
		// log(this, 'add', key, value)

		this.hasWrite(key, true) // change has
		this.isUndefinedWrite(key, value === undefined) // track when is undefined
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
		this.isUndefinedWrite(key, value === undefined) // track when is undefined

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
		// log(this, 'delete', key)

		this.hasWrite(key, false) // change has
		this.isUndefinedWrite(key, true) // track when is undefined
		this.valueWrite(key, undefined) // change value
	}

	// single signal

	/** For using exclusively with Symbols by reusing the "Value" slot */

	/**
	 * To indicate all values have been read
	 *
	 * @param {symbol} [key]
	 */
	read(key = All) {
		// log(this, 'read', key)

		signals(this.#prop(key), key, Value, undefined, 2).read()
	}
	/**
	 * To indicate all values have changed *
	 *
	 * @param {symbol} [key]
	 */
	write(key = All) {
		// log(this, 'write', key)

		signals(this.#prop(key), key, Value, undefined, 2).write()
	}

	/** `ownKeys` read */
	ownKeysRead() {
		this.read(OwnKeys)
	}
	/** To indicate keys have change */
	ownKeysWrite() {
		this.write(OwnKeys)
	}
}
