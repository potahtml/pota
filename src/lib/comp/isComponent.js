import { isFunction } from '../std/@main.js'

import { $component } from '../../constants.js'

/**
 * Returns true if the `value` is a `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isComponent = value =>
	isFunction(value) && value[$component] === null
