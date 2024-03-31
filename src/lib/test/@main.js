import '../polyfills/withResolvers.js'
import { untrack } from '../reactivity/primitives/solid.js'
import { measure } from '../std/measure.js'
import { microtask } from '../std/microtask.js'
import { stringify } from '../std/stringify.js'

export { measure }

let stop = undefined
let num = 1

/**
 * Simple test-like function
 *
 * @param {string} title - Test title
 * @param {(expect: import('./@main.js').expect) => void} fn - Test
 *   function
 * @param {boolean} [stopTesting] - To stop the tests after this one
 */
export function test(title, fn, stopTesting) {
	if (!stop) {
		stop = stop || stopTesting
		title = num++ + ' - ' + title
		console.log(title)
		try {
			fn(expect.bind(null, title, { value: 1 }))
		} catch (e) {
			error(title, e)
		}
	}
}

test.reset = () => {
	num = 1
}

/**
 * Simple expect-like function
 *
 * @param {any} value
 * @returns {Expect}
 */
export function expect(title, num, value) {
	const test = {
		toBe: (equals, expected) =>
			pass(expected, value, equals, title + ' (' + num.value++ + ')'),
		toHaveShape: (equals, expected) =>
			untrack(() =>
				pass(
					stringify(expected),
					stringify(value),
					equals,
					title + ' (' + num.value++ + ')',
				),
			),
		not: {},
	}

	for (const key in test) {
		if (key !== 'not') {
			test.not[key] = test[key].bind(null, false)
			test[key] = test[key].bind(null, true)
		}
	}
	return test
}

function pass(expected, value, equals, title) {
	const { promise, resolve, reject } = Promise.withResolvers()
	if (expected !== value && equals) {
		error(title, ' expected `', expected, '` got `', value, '`')
		reject(title, expected, value)
	} else if (expected === value && !equals) {
		error(title, ' expected to be different `', value, '`')
		reject(title, expected, value)
	} else {
		resolve(title, expected, value)
	}

	// to hide the promise error in case they dont catch it
	microtask(() => {
		promise.catch(() => {})
	})
	return promise
}

function error(title, ...args) {
	console.error('\x1b[31m' + title + '\n\x1b[0m', ...args)
}

// isProxy

const proxies = new WeakSet()

globalThis.Proxy = new Proxy(Proxy, {
	construct(target, args) {
		const proxy = new target(...args)
		proxies.add(proxy)
		return proxy
	},
})

/**
 * Returns true if value is a proxy. This is defined for debugging
 * purposes.
 *
 * @param {any} value
 */
export const isProxy = value => proxies.has(value)
