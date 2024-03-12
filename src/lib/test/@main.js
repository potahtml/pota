let testTitle = ''

let skip = false
export function test(title, fn, skipRest) {
	if (!skip) {
		testTitle = title

		try {
			fn()
		} catch (e) {
			error(e)
		}
	}
	skip = skip || skipRest
}

/**
 * @param {any} value
 * @returns {{
 * 	toBe: (expected: any) => Promise<any>
 * 	toBeUndefined: () => Promise<any>
 * 	toJSONEqual: (expected: any) => Promise<any>
 * 	not: {
 * 		toBe: (expected: any) => Promise<any>
 * 		toJSONEqual: (expected: any) => Promise<any>
 * 	}
 * }}
 */
export function expect(value) {
	const test = {
		toBe: (equals, expected) => pass(expected, value, equals),
		toJSONEqual: (equals, expected) =>
			pass(JSON.stringify(expected), JSON.stringify(value), equals),
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

function pass(expected, value, equals) {
	const { promise, resolve, reject } = Promise.withResolvers()
	if (expected !== value && equals) {
		error(' expected `', expected, '` got `', value, '`')
		reject(expected, value)
	} else if (expected === value && !equals) {
		error(' expected to be different `', value, '`')
		reject(expected, value)
	} else {
		resolve(expected, value)
	}

	// to hide the promise error in case they dont catch it
	queueMicrotask(() => {
		promise.catch(() => {})
	})
	return promise
}

function error(...args) {
	console.error('\x1b[31m' + testTitle + '\n\x1b[0m', ...args)
}

Promise.withResolvers ||
	(Promise.withResolvers = function withResolvers() {
		var a,
			b,
			c = new this(function (resolve, reject) {
				a = resolve
				b = reject
			})
		return { resolve: a, reject: b, promise: c }
	})
