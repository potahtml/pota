/**
 * Returns true when value is an Object and not null
 *
 * @param {any} value
 * @returns {boolean}
 */
export const isObject = value =>
	value !== null && typeof value === 'object'
