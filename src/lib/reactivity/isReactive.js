import { isFunction } from '#std'

import { $reactive } from '#constants'

/**
 * Returns true when value is reactive (a signal)
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isReactive = value =>
	isFunction(value) && value[$reactive] === null
