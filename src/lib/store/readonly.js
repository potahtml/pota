import { deepFreeze } from '../std.js'

/**
 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {import('#type/store.d.ts').DeepReadonly<T>}
 */
export const readonly = value => deepFreeze(value)
