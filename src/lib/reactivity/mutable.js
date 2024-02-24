import { hasOwnProperty } from '../std/hasOwnProperty.js'
import { isFunction } from '../std/isFunction.js'
import { signal } from './primitives/solid.js'

/**
 * Creates setters and getter signals for the immediate properties
 * that are already defined in the object. Non-recursive. It only
 * affects own properties and doesnt affects functions.
 *
 * @template T
 * @param {GenericObject<T>} obj
 * @returns {GenericObject<T>}
 */
export function mutable(obj) {
	for (const key in obj) {
		const value = obj[key]
		if (!isFunction(value) && hasOwnProperty(obj, key)) {
			const [get, set] = signal(value)
			Object.defineProperty(obj, key, {
				get,
				set,
			})
		}
	}
	return obj
}
