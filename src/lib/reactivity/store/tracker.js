import { create } from '../../std/create.js'
import { empty } from '../../std/empty.js'
import { is } from '../../std/is.js'
import { isFunction } from '../../std/isFunction.js'
import { Symbol } from '../../std/Symbol.js'
import { weakStore } from '../../std/weakStore.js'

import { signal } from '../primitives/solid.js'

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
 * @param {object} target
 * @returns {Track}
 */
export const tracker = target => getTracker(target, createTracker)

/**
 * Returns the signal tracking the value.
 *
 * @param {object} target
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

function signals(property, type, value, equalsType) {
	if (property[type] === undefined) {
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

const All = Symbol()
const OwnKeys = Symbol()

const Value = 1
const Has = 2
const isUndefined = 3

const defaults = {
	__proto__: null,
	[Value]: undefined,
	[Has]: undefined,
	[isUndefined]: undefined,
}

const debug = false

export class Track {
	#props = empty()

	// #id = Math.random() // debug

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
	 * Keeps track of: a value for a `key`
	 *
	 * @param {PropertyKey} key
	 * @param {any} value
	 * @returns {any} Value
	 */
	valueRead(key, value) {
		debug && console.log('valueRead', key, value)

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
	 * @returns {boolean} Indicating if the value changed
	 */
	valueWrite(key, value) {
		debug && console.log('valueWrite', key, value)

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
		debug && console.log('hasRead', key, value)

		signals(this.#prop(key), Has, value, 0)[0]()
	}
	/**
	 * Keeps track of: if a `key` is in an object.
	 *
	 * @param {PropertyKey} key
	 * @param {boolean} value - Indicating if the property is `in`
	 */
	hasWrite(key, value) {
		debug && console.log('hasWrite', key, value)

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
		debug && console.log('isUndefinedRead', key, value)

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
		debug && console.log('isUndefinedWrite', key, value)

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
		debug && console.log('add', key, value)

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
		debug && console.log('modify', key, value)

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
		debug && console.log('delete', key)

		this.hasWrite(key, false) // change has
		this.isUndefinedWrite(key, true) // track when is undefined
		this.valueWrite(key, undefined) // change value
	}

	// single signal

	/** For using exclusively with Symbols by reusing the "Value" slot */

	/** To indicate all values have been read */
	read(key = All) {
		debug && console.log('read', key)

		signals(this.#prop(key), Value, undefined, 2)[0]()
	}
	/** To indicate all values have changed */
	write(key = All) {
		debug && console.log('write', key)

		signals(this.#prop(key), Value, undefined, 2)[1]()
	}

	/** `ownKeys` read */
	ownKeysRead() {
		debug && console.log('ownKeysRead', OwnKeys)

		this.read(OwnKeys)
	}
	/** To indicate keys have change */
	ownKeysWrite() {
		debug && console.log('ownKeysWrite', OwnKeys)

		this.write(OwnKeys)
	}
}
