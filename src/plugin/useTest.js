import { microtask, untrack } from '../lib/reactive.js'
import { stringifySorted, withResolvers } from '../lib/std.js'
import { diff } from './useString.js'

/** @type boolean | undefined */
let stop = undefined
let num = 1

/**
 * Simple test-like function
 *
 * @param {string} title - Test title
 * @param {(expect: (arg) => Expect) => void} fn - Test function
 * @param {boolean} [stopTesting] - To stop the tests after this one
 * @returns {Promise<any> | undefined}
 */
export function test(title, fn, stopTesting) {
	if (!stop) {
		stop = stop || stopTesting
		title = num++ + ' - ' + title
		console.log(title)
		/** @type Promise<any>[] */
		const promises = []

		try {
			fn(expect.bind(null, title, { value: 1 }, promises))
		} catch (e) {
			error(title, e)
		}

		return Promise.all(promises)
	}
}

test.reset = () => {
	num = 1
}

/**
 * Simple expect-like function
 *
 * @param {string} title
 * @param {{value:number}} num
 * @param {Promise<any>[]} promises
 * @param {any} value
 * @returns {Expect}
 */
export function expect(title, num, promises, value) {
	const test = {
		toBe: (equals, expected) =>
			pass(
				expected,
				value,
				equals,
				title + ' (' + num.value++ + ')',
				promises,
			),
		toEqual: (equals, expected) =>
			untrack(() =>
				pass(
					stringifySorted(expected),
					stringifySorted(value),
					equals,
					title + ' (' + num.value++ + ')',
					promises,
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

function pass(expected, value, equals, title, promises) {
	const { promise, resolve, reject } = withResolvers()
	promises.push(promise)
	if (expected !== value && equals) {
		const [expectedPrt, valuePrt] = diff(expected, value)
		error(title, ' expected `', expectedPrt, '` got `', valuePrt, '`')
		reject(title, expected, value)
	} else if (expected === value && !equals) {
		error(title, ' expected to be different `', value, '`')
		reject(title, expected, value)
	} else {
		resolve(title, expected, value)
	}

	// to hide the promise error in case they dont catch it
	microtask(() => promise.catch(() => {}))
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
 * Returns true if value is a proxy. This is defined for
 * debugging/testing purposes.
 *
 * @param {any} value
 */
export const isProxy = value => proxies.has(value)
