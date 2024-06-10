import { isObject } from './isObject.js'

/**
 * Returns true when value is Iterable
 *
 * @param {any} value
 * @returns {boolean} True when `value` is Iterable
 */
export const isIterable = value =>
	isObject(value) && 'values' in value
