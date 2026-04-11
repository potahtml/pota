/** @jsxImportSource pota */

// Tests for pota/store `reset`: resets nested subtrees while leaving
// unrelated keys intact.
import { test } from '#test'

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
