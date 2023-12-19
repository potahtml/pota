import { signal } from './primitives/solid.js'

/**
 * Creates setters and getter signals for the immediate properties
 * that are already defined in the object. Non-recursive.
 *
 * @template T
 * @param {Mutable<T>} obj
 * @returns {Mutable<T>}
 */
export function mutable(obj) {
	for (const key in obj) {
		const [get, set] = signal(obj[key])
		Object.defineProperty(obj, key, {
			get,
			set,
		})
	}
	return obj
}
