import { deepFreeze } from '../std.js'

/**
 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
export const readonly = value => deepFreeze(value)
