import { deepFreeze } from '../std.js'

/**
 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {import('#type/store.d.ts').DeepReadonly<T>}
 * @url https://pota.quack.uy/store/readonly
 */
export const readonly = value => deepFreeze(value)
