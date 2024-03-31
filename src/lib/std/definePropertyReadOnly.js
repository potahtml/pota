import { create } from './create.js'
import { defineProperty } from './defineProperty.js'

/**
 * Object.defineProperty with `configurable`, `writable` and
 * `enumerable` as `false`
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {any} value
 */
export const definePropertyReadOnly = (target, key, value) => {
	const descriptor = create(defaultsReadOnly)
	descriptor.value = value
	defineProperty(target, key, descriptor)
}

const defaultsReadOnly = {
	__proto__: null,
	configurable: false,
	enumerable: false,
	writable: false,
	value: undefined,
}
