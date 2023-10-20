/**
 * Returns true when value is a not null object
 *
 * @param {any} value
 * @returns {boolean} True when value is a not null object
 */
export const isNotNullObject = value =>
	value !== null && typeof value === 'object'
