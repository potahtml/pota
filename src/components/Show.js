import { makeCallback, memo } from '../lib/reactive.js'

import { getValue, isFunction } from '../lib/std.js'

/**
 * Renders its children based on a condition
 *
 * @type {{
 * 	<T>(props: {
 * 		when: When<T>
 * 		fallback?: JSX.Element
 * 		children: Children<
 * 			(arg: SignalAccessor<Accessed<T>>) => JSX.Element
 * 		>
 * 	}): JSX.Element
 * 	(props: {
 * 		when: When<any>
 * 		fallback?: JSX.Element
 * 		children?: JSX.Element
 * 	}): JSX.Element
 * }}
 * @url https://pota.quack.uy/Components/Show
 */
export const Show = props => {
	// callback
	const callback = makeCallback(props.children)

	// shortcircuit non-functions
	if (!isFunction(props.when)) {
		return props.when ? callback(() => props.when) : props.fallback
	}
	// signals/functions
	const value = memo(() => getValue(props.when))
	const condition = memo(() => !!value())

	return memo(() => (condition() ? callback(value) : props.fallback))
}
