import '../polyfills/withResolvers.js'

let stop = false

/**
 * Simple test-like function
 *
 * @param {string} title - Test title
 * @param {Function} fn - Test function
 * @param {boolean} [stopTesting] - To stop the tests after this one
 */
export function test(title, fn, stopTesting) {
	if (!stop) {
		console.log(title)
		try {
			fn(expect.bind(null, title))
		} catch (e) {
			error(title, e)
		}
	}
	stop = stop || stopTesting
}

/**
 * Simple expect-like function
 *
 * @param {any} value
 * @returns {{
 * 	toBe: (expected: any) => Promise<any>
 * 	toJSONEqual: (expected: any) => Promise<any>
 * 	not: {
 * 		toBe: (expected: any) => Promise<any>
 * 		toJSONEqual: (expected: any) => Promise<any>
 * 	}
 * }}
 */
export function expect(title, value) {
	const test = {
		toBe: (equals, expected) => pass(expected, value, equals, title),
		toJSONEqual: (equals, expected) =>
			pass(
				JSON.stringify(expected),
				JSON.stringify(value),
				equals,
				title,
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
	queueMicrotask(() => {
		promise.catch(() => {})
	})
	return promise
}

function error(title, ...args) {
	console.error('\x1b[31m' + title + '\n\x1b[0m', ...args)
}
