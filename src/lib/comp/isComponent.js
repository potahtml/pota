import { isFunction } from '#std'

import { $component } from '#comp'

/**
 * Returns true if the `value` is a `Component`
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isComponent = value =>
	isFunction(value) && value[$component] === null
