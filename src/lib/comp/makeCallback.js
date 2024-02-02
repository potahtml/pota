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
		(isArray(children)
			? /**
				 * When children is an array, as in >${[0, 1, 2]}< then children will
				 * end as `[[0, 1, 2]]`, so flat it
				 */
				children.length === 1 && isArray(children[0])
				? children[0]
				: children
			: [children]
		).map(child =>
			isReactive(child)
				? child()
				: isFunction(child)
					? untrack(() => child(...args))
					: child,
		),
	)
}
