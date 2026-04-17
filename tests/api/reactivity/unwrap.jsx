// Tests for `unwrap()` — recursively unwrap function-returning arrays;
// pass through non-array non-function values as-is.

import { test } from '#test'
import { unwrap } from 'pota'

await test('unwrap - unwraps functions returning arrays recursively', expect => {
	expect(unwrap(() => [1, () => 2, [3, () => 4]])).toEqual([
		1, 2, 3, 4,
	])
})

await test('unwrap - returns non-array non-function values as-is', expect => {
	expect(unwrap('hello')).toBe('hello')
	expect(unwrap(42)).toBe(42)
	expect(unwrap(null)).toBe(null)
})

await test('unwrap - already-resolved array (no functions) passes through flattened', expect => {
	expect(unwrap([1, 2, 3])).toEqual([1, 2, 3])
	expect(unwrap([])).toEqual([])
	expect(unwrap([['a'], ['b', 'c'], ['d']])).toEqual([
		'a',
		'b',
		'c',
		'd',
	])
})

await test('unwrap - deep function-in-array-in-function chains fully flatten', expect => {
	// 4 levels of alternating function/array nesting
	const deep = () => [() => [() => [1, () => 2], 3], 4, () => 5]
	expect(unwrap(deep)).toEqual([1, 2, 3, 4, 5])
})

await test('unwrap - preserves null / undefined / booleans as array items', expect => {
	// unwrap doesn't filter falsy — it only recurses on functions and
	// flattens arrays. Null and undefined round-trip.
	expect(unwrap([1, null, undefined, false, 0, ''])).toEqual([
		1,
		null,
		undefined,
		false,
		0,
		'',
	])
})

await test('unwrap - preserves object references inside the flattened array', expect => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	const result = unwrap(() => [a, [() => b]])
	expect(result[0]).toBe(a)
	expect(result[1]).toBe(b)
})

await test('unwrap - function returning a plain value (not array) is unwrapped once', expect => {
	expect(unwrap(() => 'hello')).toBe('hello')
	expect(unwrap(() => () => 42)).toBe(42)
	expect(unwrap(() => null)).toBe(null)
})
