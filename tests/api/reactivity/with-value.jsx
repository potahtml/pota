// Tests for `withValue()` and `getValue()` — function unwrapping,
// promise handling, plain-value passthrough, array-of-functions,
// pending callback semantics.

import { test, microtask } from '#test'
import { signal, withValue, getValue, root } from 'pota'

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
		withValue(
			[() => 'a', () => 'b'],
			value => seen.push(value),
		)
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
