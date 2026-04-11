/** @jsxImportSource pota */

// Tests for pota/store `readonly`: prevents writes on root and nested
// objects and arrays.
import { test } from '#test'

import { readonly } from 'pota/store'

await test('readonly - prevents writes on root and nested objects', expect => {
	const value = readonly({
		user: { name: 'Ada' },
	})

	expect(() => {
		value.user.name = 'Grace'
	}).toThrow()

	expect(() => {
		value.user = { name: 'Other' }
	}).toThrow()

	expect(value.user.name).toBe('Ada')
})

await test('readonly - prevents mutation of nested arrays', expect => {
	const value = readonly({
		items: [1, 2, 3],
	})

	expect(() => {
		value.items.push(4)
	}).toThrow()

	expect(value.items).toEqual([1, 2, 3])
})
