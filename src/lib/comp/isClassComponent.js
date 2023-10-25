import { isFunction } from '../std/@main.js'

import { $class } from '../../constants.js'

/**
 * Returns true if `value` is a class `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isClassComponent = value =>
	isFunction(value) && value[$class] === null
