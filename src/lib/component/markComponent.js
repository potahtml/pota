// allows to tell a `signal function` from a `component function`
// signals and user functions go in effects, for reactivity
// components and callbacks are untracked and wont go in effects to avoid re-rendering

import { $component } from '../../constants.js'

/**
 * Marks a function as a `Component`.
 *
 * @param {Function} fn - Function to mark as a `Component`
 * @returns {Component}
 */
export function markComponent(fn) {
	fn[$component] = undefined
	return fn
}
