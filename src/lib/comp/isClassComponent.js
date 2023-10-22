import { isFunction } from '#std'

import { $class } from '#constants'

/**
 * Returns true if `value` is a class `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isClassComponent = value =>
	isFunction(value) && value[$class] === null
