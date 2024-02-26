import { defineProperty } from '../std/defineProperty.js'
import { empty } from '../std/empty.js'
import { entries } from '../std/entries.js'
import { getOwnPropertyDescriptor } from '../std/getOwnPropertyDescriptor.js'
import { getOwnPropertyDescriptors } from '../std/getOwnPropertyDescriptors.js'
import { getPrototypeOf } from '../std/getPrototypeOf.js'
import { isFunction } from '../std/isFunction.js'
import { signal, untrack } from './primitives/solid.js'

/**
 * Creates setters and getter signals for the immediate properties
 * that are already defined in the object. Non-recursive. It only
 * affects own properties and doesnt affects functions nor symbols.
 *
 * @template T
 * @param {GenericObject<T>} obj
 * @param {PropertyKey[]} [props]
 * @returns {GenericObject<T>}
 */
export function signalify(obj, props) {
	if (props) {
		for (const key of props) {
			signalifyKey(obj, key, getOwnPropertyDescriptor(obj, key))
		}
	} else {
		signalifyObject(
			[
				obj.constructor !== Object ? getPrototypeOf(obj) : empty(),
				obj,
			],
			obj,
		)
	}

	return obj
}

function signalifyObject(sources, obj) {
	for (const source of sources) {
		const descriptors = getOwnPropertyDescriptors(source)
		for (const [key, descriptor] of entries(descriptors)) {
			signalifyKey(obj, key, descriptor)
		}
	}
}

function signalifyKey(obj, key, descriptor) {
	// may happens when they are trying to signalify a key that doesnt exists
	if (!descriptor) return

	const value = untrack(() =>
		descriptor.get ? descriptor.get.call(obj) : descriptor.value,
	)

	if (!isFunction(value)) {
		const [get, set] = signal(value)
		defineProperty(obj, key, {
			get() {
				return descriptor.get
					? (get(), descriptor.get.call(this))
					: get()
			},
			set(value) {
				set(isFunction(value) ? () => value : value)
				descriptor.set && descriptor.set.call(this, value)
			},
		})
	}
}
