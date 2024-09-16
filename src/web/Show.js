import { makeCallback, memo, resolve } from '../lib/reactive.js'

import { getValue, isNullUndefined } from '../lib/std.js'

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
	const callback = makeCallback(props.children)
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())

	// needs resolve to avoid re-rendering
	const fallback = isNullUndefined(props.fallback)
		? undefined
		: memo(() => resolve(props.fallback))

	return memo(() => (condition() ? callback(value) : fallback))
}
