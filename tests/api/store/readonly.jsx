/** @jsxImportSource pota */

// Tests for pota/store `readonly`: prevents writes on root and nested
// objects and arrays, recursive freeze, identity preservation.
import { test } from '#test'

import { readonly } from 'pota/store'

await test('readonly - prevents writes on root and nested objects', expect => {
	const value = readonly({
		user: { name: 'Ada' },
	})

	expect(() => {
		const anyUser = /** @type {any} */ (value.user)
		anyUser.name = 'Grace'
	}).toThrow()

	expect(() => {
		/** @type {any} */ (value).user = { name: 'Other' }
	}).toThrow()

	expect(value.user.name).toBe('Ada')
})

await test('readonly - prevents mutation of nested arrays', expect => {
	const value = readonly({
		items: [1, 2, 3],
	})

	expect(() => {
		const anyItems = /** @type {any[]} */ (value.items)
		anyItems.push(4)
	}).toThrow()

	expect(value.items).toEqual([1, 2, 3])
})

// --- returns the same reference (freeze in place) -------------------------

await test('readonly - returns the same reference (freezes in place)', expect => {
	const source = { a: 1 }
	const result = readonly(source)

	expect(result).toBe(source)
	expect(Object.isFrozen(source)).toBe(true)
})

// --- cannot add or delete keys --------------------------------------------

await test('readonly - prevents adding new keys to the root object', expect => {
	const value = readonly({ a: 1 })

	expect(() => {
		/** @type {any} */ (value).b = 2
	}).toThrow()

	expect('b' in value).toBe(false)
})

await test('readonly - prevents deleting keys from the root object', expect => {
	const value = readonly({ a: 1 })

	expect(() => {
		delete (/** @type {any} */ (value)).a
	}).toThrow()

	expect(value.a).toBe(1)
})

await test('readonly - prevents adding keys to nested objects', expect => {
	const value = readonly({
		nested: { a: 1 },
	})

	expect(() => {
		const anyNested = /** @type {any} */ (value.nested)
		anyNested.b = 2
	}).toThrow()

	expect('b' in value.nested).toBe(false)
})

// --- deep freeze verification ---------------------------------------------

await test('readonly - freezes deeply nested structures recursively', expect => {
	const value = readonly({
		a: {
			b: {
				c: { leaf: 'value' },
			},
		},
		list: [1, { x: 1 }],
	})

	expect(Object.isFrozen(value)).toBe(true)
	expect(Object.isFrozen(value.a)).toBe(true)
	expect(Object.isFrozen(value.a.b)).toBe(true)
	expect(Object.isFrozen(value.a.b.c)).toBe(true)
	expect(Object.isFrozen(value.list)).toBe(true)
	expect(Object.isFrozen(value.list[1])).toBe(true)
})

// --- primitives are returned as-is ----------------------------------------

await test('readonly - primitive values pass through unchanged', expect => {
	expect(readonly(42)).toBe(42)
	expect(readonly('hello')).toBe('hello')
	expect(readonly(true)).toBe(true)
	expect(readonly(null)).toBe(null)
	expect(readonly(undefined)).toBe(undefined)
})

// --- cannot modify nested array element -----------------------------------

await test('readonly - prevents replacing items in a nested array by index', expect => {
	const value = readonly({
		items: [{ id: 1 }, { id: 2 }],
	})

	expect(() => {
		const anyItems = /** @type {any[]} */ (value.items)
		anyItems[0] = { id: 99 }
	}).toThrow()

	expect(value.items[0].id).toBe(1)
})

// --- freezing an empty object ---------------------------------------------

await test('readonly - empty object is frozen and cannot gain keys', expect => {
	const value = readonly({})

	expect(Object.isFrozen(value)).toBe(true)
	expect(() => {
		/** @type {any} */ (value).a = 1
	}).toThrow()
})
