// Tests for `withValue()` and `getValue()` — function unwrapping,
// promise handling, plain-value passthrough, array-of-functions,
// pending callback semantics.

import { test, microtask, sleep } from '#test'
import { signal, withValue, getValue, catchError, root } from 'pota'

await test('withValue and getValue - unwrap functions and promises', async expect => {
	const count = signal(1)
	const seen = []

	withValue(
		() => count.read(),
		value => seen.push(value),
	)
	withValue(
		Promise.resolve(3),
		value => seen.push(value),
		() => seen.push('pending'),
	)

	expect(getValue(() => () => count.read())).toBe(1)
	expect(seen).toEqual([1, 'pending'])

	count.write(2)
	await microtask()

	expect(seen).toEqual([1, 'pending', 2, 3])
})

await test('withValue - handles plain values without pending callbacks', expect => {
	const seen = []

	root(() => {
		withValue(
			5,
			value => seen.push(value),
			() => seen.push('pending'),
		)
	})

	expect(seen).toEqual([5])
})

// --- withValue with array of values ------------------------------------------

await test('withValue - handles array of functions by unwrapping each', expect => {
	const seen = []

	root(() => {
		withValue([() => 'a', () => 'b'], value => seen.push(value))
	})

	expect(seen).toEqual([['a', 'b']])
})

// --- withValue with static non-function value calls fn immediately -----------

await test('withValue - non-function value calls fn once immediately', expect => {
	const seen = []

	withValue(42, v => seen.push(v))
	withValue('hello', v => seen.push(v))

	expect(seen).toEqual([42, 'hello'])
})

// --- getValue with mixed input types ------------------------------

await test('getValue - unwraps a function but passes through primitives', expect => {
	expect(getValue(42)).toBe(42)
	expect(getValue('s')).toBe('s')
	expect(getValue(null)).toBe(null)
	expect(getValue(undefined)).toBe(undefined)
	expect(getValue(() => 'fn-result')).toBe('fn-result')
})

// --- withValue empty array resolves immediately ------------------------

await test('withValue - empty array calls fn once with []', expect => {
	const seen = []

	root(() => {
		withValue(
			[],
			value => seen.push(value),
			() => seen.push('pending'),
		)
	})

	// No items to wait for — fn runs immediately with the empty array.
	expect(seen).toEqual([[]])
})

// --- withValue with mixed sync and async items --------------------------

await test('withValue - array mixing sync primitives and a promise waits for all', async expect => {
	const seen = []

	root(() => {
		withValue(
			['sync', Promise.resolve('async'), 42],
			value => seen.push(value),
			() => seen.push('pending'),
		)
	})

	// Before the promise settles the default is written once.
	expect(seen).toEqual(['pending'])

	await microtask()

	// After resolution, fn is called exactly once with the fully
	// resolved array.
	expect(seen).toEqual(['pending', ['sync', 'async', 42]])
})

// --- withValue promise rejection routes to catchError -----------------

await test('withValue - rejected promise routes to the nearest catchError', async expect => {
	/** @type {any} */
	let caught
	const seen = []

	root(() => {
		catchError(
			() => {
				withValue(
					Promise.reject(new Error('withValue fail')),
					value => seen.push(value),
					() => seen.push('pending'),
				)
			},
			err => {
				caught = err
			},
		)
	})

	expect(seen).toEqual(['pending'])

	await sleep(10)

	expect(caught instanceof Error).toBe(true)
	expect(caught.message).toBe('withValue fail')
	// fn never got called because the promise rejected — only the
	// pending default was written.
	expect(seen).toEqual(['pending'])
})

// --- withValue unhandled rejection falls through to console.error ----

await test('withValue - rejection without handler reaches console.error', async expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	const dispose = root(d => {
		withValue(
			Promise.reject(new Error('unhandled wv')),
			() => {},
			() => {},
		)
		return d
	})

	await sleep(10)

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('unhandled wv')

	console.error = original
	dispose()
})
