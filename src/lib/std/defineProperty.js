import { assign } from './assign.js'
import { create } from './create.js'

export const defineProperty = Object.defineProperty

/**
 * Object.defineProperty with `enumerable` and `configurable` set to
 * `true` unless overwriten by `descriptor` argument
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 */
export const redefineProperty = (target, key, descriptor) =>
	defineProperty(target, key, assign(create(defaults), descriptor))

const defaults = {
	__proto__: null,
	configurable: true,
	enumerable: true,
}

/**
 * Object.defineProperty with `configurable`, `writable` and
 * `enumerable` as `false`
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {any} value
 */
export const definePropertyValueReadOnly = (target, key, value) => {
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
