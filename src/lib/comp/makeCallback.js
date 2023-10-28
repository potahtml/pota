import { untrack } from '../reactivity/primitives/solid.js'
import { isArray, isFunction } from '../std/@main.js'
import { isReactive } from '../reactivity/@main.js'
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
