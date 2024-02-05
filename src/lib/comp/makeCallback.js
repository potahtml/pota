import { untrack } from '../reactivity/primitives/solid.js'
import { flat, isArray, isFunction } from '../std/@main.js'
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
	/**
	 * When children is an array, as in >${[0, 1, 2]}< then children
	 * will end as `[[0, 1, 2]]`, so flat it
	 */
	children = isArray(children) ? flat(children) : children
	const asArray = isArray(children)
	const callbacks = !asArray
		? callback(children)
		: children.map(callback)
	return !asArray
		? markComponent((...args) => callbacks(args))
		: markComponent((...args) =>
				callbacks.map(callback => callback(args)),
			)
}

const callback = child =>
	isReactive(child)
		? () => child()
		: isFunction(child)
			? args => untrack(() => child(...args))
			: () => child
