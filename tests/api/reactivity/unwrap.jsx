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
