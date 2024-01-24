/**
 * Unwraps values. If the argument is a function then it runs it
 * recursively and returns the value
 *
 * @param {Function | any} value - Maybe function
 * @returns {any}
 */
export const getValue = value => {
	while (typeof value === 'function') value = value()
	return value
}
