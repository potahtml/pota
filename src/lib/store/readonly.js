import { deepFreeze } from '../std.js'

/**
 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
export function readonly(value) {
	deepFreeze(value)
	return value
}
