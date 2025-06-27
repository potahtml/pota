import { stringifySorted, window, withResolvers } from '../lib/std.js'

import { microtask, untrack } from '../lib/reactive.js'

import { diff } from './string.js'
import { addAdoptedStyleSheet, css } from './css.js'

/** @type {boolean | undefined} */
let stop = undefined
let num = 1

/**
 * A simple test function that mimics the behavior of testing
 * frameworks. It takes a title, a test function, and an optional flag
 * to stop testing after this test. The test function receives an
 * `expect` function to make assertions.
 *
 * @param {string} title - The title of the test case.
 * @param {(expect: (arg: unknown) => Expect) => void} fn - The test
 *   function containing assertions.
 * @param {boolean} [stopTesting] - If true, no more tests will be run
 *   after this one.
 * @returns {Promise<unknown> | undefined} A promise that resolves
 *   when all assertions in the test pass, or rejects if any assertion
 *   fails.
 */
export function test(title, fn, stopTesting) {
	if (!stop) {
		stop = stop || stopTesting
		title = num++ + ' - ' + title
		console.log(title)
		/** @type Promise<unknown>[] */
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
 * @param {{ value: number }} num
 * @param {Promise<unknown>[]} promises
 * @param {unknown} value
 * @returns {Expect}
 */
export function expect(title, num, promises, value) {
	const test = {
		toBe: expected =>
			pass(
				expected,
				value,
				true,
				title + ' (' + num.value++ + ')',
				promises,
			),
		toEqual: expected =>
			untrack(() =>
				pass(
					stringifySorted(expected),
					stringifySorted(value),
					true,
					title + ' (' + num.value++ + ')',
					promises,
				),
			),
		not: {
			toBe: expected =>
				pass(
					expected,
					value,
					false,
					title + ' (' + num.value++ + ')',
					promises,
				),
			toEqual: expected =>
				untrack(() =>
					pass(
						stringifySorted(expected),
						stringifySorted(value),
						false,
						title + ' (' + num.value++ + ')',
						promises,
					),
				),
		},
	}

	return test
}

/**
 * Validates if a test assertion passes or fails
 *
 * @param {unknown} expected - Expected value
 * @param {unknown} value - Actual value
 * @param {boolean} equals - Whether values should be equal
 * @param {string} title - Test title
 * @param {Promise<unknown>[]} promises - Array to collect test
 *   promises
 * @returns {Promise<unknown>} Promise that resolves/rejects based on
 *   assertion result
 */
function pass(expected, value, equals, title, promises) {
	const { promise, resolve, reject } = withResolvers()
	promises.push(promise)
	if (expected !== value && equals) {
		const [expectedPrt, valuePrt] = diff(expected, value)
		error(title, ' expected `', expectedPrt, '` got `', valuePrt, '`')
		reject({ title, expected, value })
	} else if (expected === value && !equals) {
		error(title, ' expected to be different `', value, '`')
		reject({ title, expected, value })
	} else {
		resolve({ title, expected, value })
	}

	// to hide the promise error in case they dont catch it
	microtask(() => promise.catch(() => {}))
	return promise
}

/**
 * Logs an error message with test title in red color
 *
 * @param {string} title - The test title
 * @param {...unknown} args - Additional arguments to log
 */
function error(title, ...args) {
	console.error('\x1b[31m' + title + '\n\x1b[0m', ...args)
}

// isProxy

const proxies = new WeakSet()

window.Proxy = new Proxy(Proxy, {
	construct(target, args) {
		const proxy = Reflect.construct(target, args)
		proxies.add(proxy)
		return proxy
	},
})

/**
 * Returns true if value is a proxy. This is defined for
 * debugging/testing purposes.
 *
 * @param {object} value
 */
export const isProxy = value => proxies.has(value)

export const rerenders = () =>
	addAdoptedStyleSheet(
		document,
		css`
			* {
				animation-duration: 1s;
				animation-name: render;
			}
			@keyframes render {
				from {
					background: rgba(88, 166, 255, 0.5);
				}
				to {
					background: transparent;
				}
			}
		`,
	)
