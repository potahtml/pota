import { makeCallback, memo, resolve } from '../lib/reactive.js'

import { getValue, isFunction, isNullUndefined } from '../lib/std.js'

/**
 * Renders its children based on a condition
 *
 * @template T
 * @param {object} props
 * @param {When<T>} props.when
 * @param {Children} [props.fallback]
 * @param {Children} [props.children]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Show
 */
export function Show(props) {
	// fallback
	const fallback = isNullUndefined(props.fallback)
		? undefined
		: memo(() => resolve(props.fallback))

	// callback
	const callback = makeCallback(props.children)

	// shortcircuit non-functions
	if (!isFunction(props.when)) {
		return props.when ? callback(() => props.when) : fallback
	}

	// signals/functions
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())

	return memo(() => (condition() ? callback(value) : fallback))
}
