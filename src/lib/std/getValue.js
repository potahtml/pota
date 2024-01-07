/**
 * Unwraps values. If the argument is a function then it runs it and
 * returns the value
 *
 * @param {Function | any} value - Maybe function
 * @param {...any} args? - Arguments
 * @returns {any}
 */
export const getValue = (value, ...args) =>
	typeof value === 'function'
		? args.length
			? getValue(value(...args))
			: getValue(value())
		: value
