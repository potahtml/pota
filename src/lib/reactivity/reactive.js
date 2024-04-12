import { Symbol } from '../std/Symbol.js'
import { isFunction } from '../std/isFunction.js'

export {
	signal,
	memo,

	// effects
	syncEffect,
	effect,

	// utils
	batch,
	untrack,

	// ownership
	root,
	owner,
	runWithOwner,
	cleanup,
} from './liquid.js'

import { owner, syncEffect, runWithOwner } from './liquid.js'

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {any} [defaultValue] - Default value for the context
 * @returns {typeof Context} Context
 */
export function Context(defaultValue = undefined) {
	const id = Symbol()

	/**
	 * @overload Gets the context value
	 * @returns {any} Context value
	 */
	/**
	 * @overload Runs `fn` with a new value as context
	 * @param {any} newValue - New value for the context
	 * @param {Function} fn - Callback to run with the new context value
	 * @returns {Children} Children
	 */
	/**
	 * @param {any} newValue
	 * @param {Function} fn
	 */
	function Context(newValue, fn) {
		if (newValue === undefined) {
			const o = owner()

			return o && o.context && o.context[id] !== undefined
				? o.context[id]
				: defaultValue
		} else {
			let res
			syncEffect(() => {
				const o = owner()
				o.context = {
					...o.context,
					[id]: newValue,
				}
				res = fn()
			})

			return res
		}
	}

	return Context
}

/**
 * Returns a function on which you can pass functions to run with the
 * current owner
 *
 * @returns {(fn) => any}
 */
export const withOwner = () => {
	const o = owner()
	return fn => (isFunction(fn) ? runWithOwner(o, fn) : fn)
}
