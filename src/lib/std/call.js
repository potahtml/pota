import { isArray } from '#std'

/**
 * Runs arrays of functions with arguments
 *
 * @param {Function[]} fns - Hash to scroll to
 * @param {...any} args - Arguments to pass to the functions
 */
export function call(fns, ...args) {
	for (const fn of fns)
		isArray(fn) ? fn[0](...args, ...fn.slice(1)) : fn(...args)
}
