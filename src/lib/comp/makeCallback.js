import { untrack } from '#main'
import { isArray, isFunction } from '#std'
import { isReactive } from '#reactivity'

import { markComponent } from '#comp'

/**
 * Makes of `children` a function. Reactive children will run as is,
 * non-reactive children will run untracked, regular children will
 * just return.
 *
 * @param {pota.children} children
 * @returns {Function}
 */
export function makeCallback(children) {
	// ensure is an array
	// the transformer gives arrays but user components could return anything
	// function MyComponent() { return 'Something'} // children wont be an array

	children = (isArray(children) ? children : [children]).map(fn =>
		isReactive(fn)
			? fn
			: isFunction(fn)
			? (...args) => untrack(() => fn(...args))
			: () => fn,
	)
	return markComponent((...args) => children.map(fn => fn(...args)))
}
