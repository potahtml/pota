import { untrack } from '../reactivity/primitives/solid.js'
import { isArray, isFunction } from '../std/@main.js'
import { isReactive } from '../reactivity/isReactive.js'
import { markComponent } from './markComponent.js'

/**
 * Makes of `children` a function. Reactive children will run as is,
 * non-reactive children will run untracked, regular children will
 * just return.
 *
 * @param {Children} children
 * @returns {Function}
 */
export function makeCallback(children) {
	return markComponent((...args) =>
		(isArray(children) ? children : [children]).map(child =>
			isReactive(child)
				? child()
				: isFunction(child)
					? untrack(() => child(...args))
					: child,
		),
	)
}
