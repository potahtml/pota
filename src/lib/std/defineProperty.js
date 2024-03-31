import { Object } from './Object.js'
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
