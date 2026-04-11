/** @jsxImportSource pota */

// Tests for pota/store `reset`: resets nested subtrees while leaving
// unrelated keys intact. Arrays and empty objects are replaced
// wholesale; plain nested objects recurse.
import { test } from '#test'

import { root, syncEffect } from 'pota'
import { mutable, reset } from 'pota/store'

await test('reset - resets only the provided subtree and leaves unrelated keys', expect => {
	const target = mutable({
		stable: true,
		nested: {
			count: 3,
			keep: 'yes',
			deep: { ok: true },
		},
		list: [1, 2, 3],
	})

	reset(target, {
		nested: {
			count: 0,
			deep: {},
		},
		list: [],
	})

	expect(target.stable).toBe(true)
	expect(target.nested.count).toBe(0)
	expect(target.nested.keep).toBe('yes')
	expect(target.nested.deep).toEqual({})
	expect(target.list).toEqual([])
})

await test('reset - can restore arrays of objects back to the provided shape', expect => {
	const target = mutable({
		items: [
			{ id: 1, value: 'a' },
			{ id: 2, value: 'b' },
		],
	})

	reset(target, {
		items: [{ id: 1, value: 'reset' }],
	})

	expect(target.items).toEqual([{ id: 1, value: 'reset' }])
})

await test('reset - does not remove keys absent from source', expect => {
	const target = mutable({ a: 1, b: 2, c: 3 })

	reset(target, { a: 0 })

	expect(target.a).toBe(0)
	expect(target.b).toBe(2)
	expect(target.c).toBe(3)
})

await test('reset - recursively resets nested objects', expect => {
	const target = mutable({
		a: {
			b: {
				c: 99,
				d: 'keep',
			},
		},
	})

	reset(target, {
		a: {
			b: {
				c: 0,
			},
		},
	})

	expect(target.a.b.c).toBe(0)
	expect(target.a.b.d).toBe('keep')
})

// --- reset adds keys that do not exist in target -------------------------

await test('reset - adds keys from source that are missing in target', expect => {
	const target = mutable({ a: 1 })

	reset(target, { b: 2 })

	expect(target).toEqual({ a: 1, b: 2 })
})

// --- morph cases ---------------------------------------------------------

await test('reset - replaces array with object on type morph', expect => {
	const target = mutable({ data: [1, 2, 3] })

	reset(target, { data: { k: 'v' } })

	expect(Array.isArray(target.data)).toBe(false)
	expect(target.data).toEqual({ k: 'v' })
})

await test('reset - replaces object with array on type morph', expect => {
	const target = mutable({ data: { k: 'v' } })

	reset(target, { data: [1, 2] })

	expect(Array.isArray(target.data)).toBe(true)
	expect(target.data).toEqual([1, 2])
})

// --- empty object in source means "replace with empty" -------------------

await test('reset - empty object in source resets the whole subtree', expect => {
	const target = mutable({
		nested: { a: 1, b: 2, c: 3 },
	})

	reset(target, { nested: {} })

	expect(target.nested).toEqual({})
})

// --- source immutability -------------------------------------------------

await test('reset - does not mutate the source', expect => {
	const target = mutable({ a: 1 })
	const source = { a: 2, nested: { x: 1 } }

	reset(target, source)

	expect(source).toEqual({ a: 2, nested: { x: 1 } })
	// Nested in target should be its own reactive copy, not the source's
	target.nested.x = 99
	expect(source.nested.x).toBe(1)
})

// --- reactivity ----------------------------------------------------------

await test('reset - triggers effects for changed keys', expect => {
	const state = mutable({ count: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([1])

	reset(state, { count: 5 })

	expect(seen).toEqual([1, 5])
})

await test('reset - writing the same primitive value does not re-trigger effects', expect => {
	const state = mutable({ count: 5 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([5])

	reset(state, { count: 5 })

	expect(seen).toEqual([5])
})

// --- arrays are replaced wholesale (not merged by position) --------------

await test('reset - arrays are replaced wholesale regardless of length', expect => {
	const target = mutable({ items: [1, 2, 3, 4, 5] })

	reset(target, { items: [10] })

	expect(target.items.length).toBe(1)
	expect(target.items[0]).toBe(10)
})
