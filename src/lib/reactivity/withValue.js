import { getValue } from '../std/getValue.js'
import { isFunction } from '../std/isFunction.js'
import { effect } from './primitives/solid.js'

/**
 * Runs a function inside an effect if value is a function
 *
 * @param {any} value
 * @param {(value) => any} fn
 */
export const withValue = (value, fn) =>
	isFunction(value)
		? effect(() => {
				fn(getValue(value))
			})
		: fn(value)
