/** @jsxImportSource pota */

// Tests for pota/store `replace`: keyed references, length adjustment,
// reordering, removal, source immutability, reactivity, and no-op on
// identical data.
import { test } from '#test'

import { root, syncEffect } from 'pota'
import { mutable, replace } from 'pota/store'

await test('replace - removes missing keys and keeps keyed references', expect => {
	const kept = { id: 1, label: 'kept' }
	const target = mutable({
		stale: true,
		users: [{ id: 0, label: 'drop' }, kept],
	})
	const ref = target.users[1]

	replace(
		target,
		{
			users: [{ id: 1, extra: 'merged' }],
			fresh: true,
		},
		{ users: { key: 'id' } },
	)

	expect('stale' in target).toBe(false)
	expect(target.fresh).toBe(true)
	expect(target.users.length).toBe(1)
	expect(target.users[0]).toBe(ref)
	expect(target.users[0]).toEqual({
		id: 1,
		extra: 'merged',
	})
})

await test('replace - removes all original keys when replaced with empty', expect => {
	const target = mutable({ a: 1, b: 2, c: 3 })

	replace(target, {})

	expect('a' in target).toBe(false)
	expect('b' in target).toBe(false)
	expect('c' in target).toBe(false)
})

await test('replace - reorders keyed arrays and removes absent items', expect => {
	const target = mutable({
		items: [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
			{ id: 3, name: 'c' },
		],
	})

	const refB = target.items[1]

	replace(
		target,
		{
			items: [
				{ id: 3, name: 'c-updated' },
				{ id: 2, name: 'b' },
			],
		},
		{ items: { key: 'id' } },
	)

	// id:1 removed, id:2 and id:3 kept in target order
	expect(target.items.length).toBe(2)
	expect(target.items[0]).toBe(refB)
	expect(target.items[0].name).toBe('b')
	expect(target.items[1].name).toBe('c-updated')
})

await test('replace - adjusts array length when source is shorter', expect => {
	const target = mutable({ items: [1, 2, 3, 4, 5] })

	replace(target, { items: [10, 20] })

	expect(target.items.length).toBe(2)
	expect(target.items).toEqual([10, 20])
})

await test('replace - identical data does not trigger extra updates', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.a)
		})
	})

	expect(seen).toEqual([1])

	replace(state, { a: 1, b: 2 })

	// a didn't change value, so no extra trigger
	expect(seen).toEqual([1])
})

// --- source immutability --------------------------------------------------

await test('replace - does not mutate the source', expect => {
	const target = mutable({ a: 1, b: 2 })
	const source = { a: 10, c: 3 }

	replace(target, source)

	expect(source).toEqual({ a: 10, c: 3 })
})

// --- nested objects are reconciled, not overwritten ----------------------

await test('replace - reconciles nested objects while removing missing keys', expect => {
	const target = mutable({
		user: { name: 'Ada', role: 'admin', extra: true },
	})

	replace(target, {
		user: { name: 'Grace', role: 'user' },
	})

	// extra key removed because not in source
	expect(target.user).toEqual({ name: 'Grace', role: 'user' })
})

// --- reactivity -----------------------------------------------------------

await test('replace - triggers effects for removed keys', expect => {
	const state = mutable({ a: 1, b: 2 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('b' in state ? state.b : 'gone')
		})
	})

	expect(seen).toEqual([2])

	replace(state, { a: 1 })

	expect(seen).toEqual([2, 'gone'])
})

await test('replace - triggers effects for added keys', expect => {
	const state = mutable({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push('b' in state ? state.b : 'absent')
		})
	})

	expect(seen).toEqual(['absent'])

	replace(state, { a: 1, b: 99 })

	expect(seen).toEqual(['absent', 99])
})

// --- deeply nested keyed arrays ------------------------------------------

await test('replace - keyed reconcile at a nested array path', expect => {
	const target = mutable({
		group: {
			users: [
				{ id: 1, name: 'Ada' },
				{ id: 2, name: 'Grace' },
				{ id: 3, name: 'Hopper' },
			],
		},
	})

	const refGrace = target.group.users[1]

	replace(
		target,
		{
			group: {
				users: [{ id: 2, name: 'Grace Hopper' }],
			},
		},
		{ group: { users: { key: 'id' } } },
	)

	// Grace kept by reference with updated name
	expect(target.group.users.length).toBe(1)
	expect(target.group.users[0]).toBe(refGrace)
	expect(target.group.users[0].name).toBe('Grace Hopper')
})

// --- replace with same length plain array --------------------------------

await test('replace - plain arrays of same length replace by index', expect => {
	const target = mutable({ items: [1, 2, 3] })

	replace(target, { items: [10, 20, 30] })

	expect(target.items).toEqual([10, 20, 30])
})

// --- replace with longer plain array -------------------------------------

await test('replace - plain arrays of different lengths resize', expect => {
	const target = mutable({ items: [1, 2] })

	replace(target, { items: [10, 20, 30, 40] })

	expect(target.items).toEqual([10, 20, 30, 40])
})

// --- morph cases ----------------------------------------------------------

await test('replace - replaces array with object when type morphs', expect => {
	const target = mutable({ data: [1, 2, 3] })

	replace(target, { data: { key: 'val' } })

	expect(Array.isArray(target.data)).toBe(false)
	expect((/** @type {any} */ (target.data)).key).toBe('val')
})
