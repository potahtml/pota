import { untrack } from '#main'
import { isArray, isFunction } from '#std'
import { isReactive } from '#reactivity'

import { markComponent } from '#comp'

// makes untracked callbacks from childrens
// it should track only reactive children like signals or memos
// children could also be regular children and not functions

export function makeCallback(fns) {
	// ensure is an array
	// the transformer gives arrays but user components could return anything
	// function MyComponent() { return 'Something'} // children wont be an array
	fns = (isArray(fns) ? fns : [fns]).map(fn =>
		isReactive(fn)
			? fn
			: isFunction(fn)
			? (...args) => untrack(() => fn(...args))
			: () => fn,
	)
	return markComponent((...args) => fns.map(fn => fn(...args)))
}
