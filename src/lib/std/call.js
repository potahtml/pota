import { isArray } from '#std'

// runs arrays of functions with arguments
export function call(fns, ...args) {
	for (const fn of fns)
		isArray(fn) ? fn[0](...args, ...fn.slice(1)) : fn(...args)
}
