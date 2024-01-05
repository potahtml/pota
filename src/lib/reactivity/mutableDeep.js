import { empty } from '../std/empty.js'
import { batch, signal } from './primitives/solid.js'

/**
 * Creates setters and getter signals for an object. Recursive.
 *
 * @template T
 * @param {GenericObject<T>} value
 * @returns {GenericObject<T>}
 */
export function mutableDeep(value) {
	// console.log('creating proxy for', value)
	return getValue(value, typeof value)
}

// keeps track of what objects have already been made into a proxy.
const Proxied = new WeakMap()

// ensures a value is made into a proxy only once when is an object
function getValue(value, type) {
	return type === 'object' && value !== null && !Proxied.has(value)
		? makeProxy(value)
		: value
}

// makes a proxy from an object
function makeProxy(value) {
	const proxy = new Proxy(value, handler)
	Proxied.set(proxy, null) // signal(undefined, { equals: false }) to track self
	return proxy
}

// returns true for keys that shouldnt be transformed into getters/setters
function keyInPrototype(target, key) {
	return (
		(key in target && !target.hasOwnProperty(key)) ||
		cannotRedefine(target, key)
	)
}

// returns true for keys that cannot be redefined
function cannotRedefine(target, key) {
	return Array.isArray(target) && key === 'length'
}

// keeps track of properties that already been transformed to getters/setters

const Signals = new WeakMap()
function getSignals(target) {
	let signals = Signals.get(target)
	if (!signals) {
		signals = empty()
		Signals.set(target, signals)
	}
	return signals
}

function setters(target, key, value) {
	// console.log('creating setters/getters for', key)

	const [read, write] = signal(
		typeof value === 'function' ? () => value : value,
	)

	Object.defineProperty(target, key, {
		get() {
			// console.log('GETTER for', key, read())
			return read()
		},
		set(value) {
			const type = typeof value
			value = getValue(value, typeof value)
			// console.log('SETTER for', key, value)
			write(type === 'function' ? () => value : value)
		},
		enumerable: true,
		configurable: true,
	})
}

function signalExistsForKey(target, key) {
	const signals = getSignals(target)
	return signals[key] === null
}

const handler = {
	get(target, key, proxy) {
		// console.log('------- get', key)
		// do not do anything for keys that dont exists
		if (!(key in target)) {
			// console.log(key, 'DOESNT exists', key in proxy)
			return undefined
		}

		// signal is already set, just return it
		if (signalExistsForKey(target, key)) {
			// console.log('signal already exists', key)
			return Reflect.get(target, key, proxy)
		}

		// no signal exists
		// console.log('signal DOESNT exist for', key)

		// get value
		let value = target[key]
		const type = typeof value
		value = getValue(value, type)

		// console.log('what 2')

		// run functions in a batch to prevent malfunction on arrays
		if (type === 'function' && keyInPrototype(target, key)) {
			return (...args) => {
				return batch(() => Reflect.apply(target[key], proxy, args))
			}
		}

		// set signal
		if (!keyInPrototype(target, key)) {
			const signals = getSignals(target)
			if (signals[key] === undefined) {
				signals[key] = null
				setters(target, key, value)
			}
		}

		return target[key]
	},
	set(target, key, value, proxy) {
		// console.log('------- set', key)

		// resolve value (aka creates a proxy for an object if needed)
		const type = typeof value
		value = getValue(value, type)

		// create getters/setters signal if doesnt exists
		const signals = getSignals(target)
		if (signals[key] === undefined) {
			signals[key] = null

			// should skip properties that cannot be redefined
			if (!cannotRedefine(target, key)) {
				// console.log('WHAT')
				setters(target, key, value)
			}
		}

		// reflect value
		return Reflect.set(target, key, value, proxy)
	},
	ownKeys(target) {
		return Reflect.ownKeys(target)
	},
	has(target, key) {
		return Reflect.has(target, key)
	},
	deleteProperty(target, key) {
		batch(() => {
			// if target[key] is already undefined, then it wont trigger an update
			// set to null first then to undefined to force an update
			target[key] = null
			target[key] = undefined
		})
		Reflect.deleteProperty(target, key)
		return true
	},
}
