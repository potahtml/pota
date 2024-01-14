import { isFunction } from '../std/@main.js'

import { $reactive } from '../../constants.js'

/**
 * Returns true when value is reactive (a signal)
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isReactive = value =>
	isFunction(value) && $reactive in value
