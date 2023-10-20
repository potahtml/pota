/**
 * Unwraps values. If the argument is a function then it runs it and
 * returns the value
 *
 * @param {Function | any} value - Maybe function
 * @returns {any}
 */
export const getValue = value =>
	typeof value === 'function' ? getValue(value()) : value
