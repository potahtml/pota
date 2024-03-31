import { getOwnPropertyDescriptor } from './getOwnPropertyDescriptor.js'
import { isObject } from './isObject.js'

/**
 * When `value` is an object, it will check if the `key` on `target`
 * is `configurable`
 *
 * @param {object} target
 * @param {PropertyKey} key
 * @param {any} value
 */
export const isConfigurable = (target, key, value) => {
	if (isObject(value)) {
		const descriptor = getOwnPropertyDescriptor(target, key)
		if (descriptor) {
			return descriptor.configurable
		}
	}
	return true
}
