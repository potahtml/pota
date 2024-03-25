import { isArray } from './isArray.js'

/**
 * Runs arrays of functions with arguments
 *
 * @param {Function | Function[]} fn
 * @param {...any} args? - Arguments to pass to the functions
 */
export const call = (fn, ...args) =>
	isArray(fn) ? fn[0](...args, ...fn.slice(1)) : fn(...args)
