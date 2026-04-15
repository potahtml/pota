/** @jsxImportSource pota */

// Tests for pota/store `merge`: deep merge, scalar writes, keyed
// arrays, type morphing, source immutability, and empty sources.
import { test } from '#test'

import { root, syncEffect } from 'pota'
import { merge, mutable } from 'pota/store'

await test('merge - deeply merges objects and appends array values', expect => {
	const target = mutable({
		flags: { a: true },
		list: [1, 2],
	})

	merge(target, {
		flags: { b: true },
		list: [3],
	})

	expect(target).toEqual({
		flags: { a: true, b: true },
		list: [3, 2],
	})
})

await test('merge - writes plain scalar values directly', expect => {
	const target = mutable({
		count: 1,
		label: 'before',
	})

	merge(target, {
		count: 2,
		label: 'after',
	})

	expect(target).toEqual({
		count: 2,
		label: 'after',
	})
})

await test('merge - keyed arrays preserve matching object references', expect => {
	const kept = { id: 1, name: 'Ada' }
	const target = mutable({
		users: [{ id: 0, name: 'Zero' }, kept],
	})

	const ref = target.users[1]

	expect(target.users[1] === ref).toBe(true)

	merge(
		target,
		{
			users: [
				{ id: 2, name: 'Two' },
				{ id: 1, role: 'admin' },
			],
		},
		{ users: { key: 'id' } },
	)

	expect(target.users[1] === ref).toBe(true)
	expect(target.users).toEqual([
		{ id: 0, name: 'Zero' },
		{ id: 1, name: 'Ada', role: 'admin' },
		{ id: 2, name: 'Two' },
	])
})

await test('merge - adds keys that do not exist in target', expect => {
	const target = mutable({ a: 1 })

	merge(target, { b: 2, c: 3 })

	expect(target).toEqual({ a: 1, b: 2, c: 3 })
})

await test('merge - replaces when type morphs between array and object', expect => {
	const target = mutable({ data: [1, 2, 3] })

	merge(target, { data: { key: 'value' } })

	expect(Array.isArray(target.data)).toBe(false)
	expect((/** @type {any} */ (target.data)).key).toBe('value')
})

await test('merge - replaces when type morphs from object to array', expect => {
	const target = mutable({ data: { key: 'value' } })

	merge(target, { data: [1, 2] })

	expect(Array.isArray(target.data)).toBe(true)
	expect(target.data).toEqual([1, 2])
})

await test('merge - empty source does not modify target', expect => {
	const target = mutable({ a: 1, b: 2 })

	merge(target, {})

	expect(target.a).toBe(1)
	expect(target.b).toBe(2)
})

// --- source immutability --------------------------------------------------

await test('merge - does not mutate the source', expect => {
	const target = mutable({ a: 1 })
	const source = { b: 2, nested: { inner: true } }

	merge(target, source)

	// source should remain as passed in
	expect(source).toEqual({ b: 2, nested: { inner: true } })
	expect(source.nested.inner).toBe(true)
})

// --- deeply nested objects reconcile recursively -------------------------

await test('merge - reconciles objects three levels deep', expect => {
	const target = mutable({
		a: {
			b: {
				c: { original: true, kept: 1 },
				keepChild: { x: 1 },
			},
		},
	})

	merge(target, {
		a: {
			b: {
				c: { updated: true },
			},
		},
	})

	expect(target.a.b.c).toEqual({
		original: true,
		kept: 1,
		updated: true,
	})
	// unrelated subtree is untouched
	expect(target.a.b.keepChild).toEqual({ x: 1 })
})

// --- target keys not present in source stay put --------------------------

await test('merge - leaves target keys that are absent in source', expect => {
	const target = mutable({ a: 1, b: 2, c: 3 })

	merge(target, { a: 10 })

	expect(target).toEqual({ a: 10, b: 2, c: 3 })
})

// --- array length differences --------------------------------------------

await test('merge - appends new array elements past target length', expect => {
	const target = mutable({ items: [1] })

	merge(target, { items: [10, 20, 30] })

	// index 0 is replaced, indexes 1 and 2 are added
	expect(target.items).toEqual([10, 20, 30])
})

await test('merge - source array shorter than target leaves trailing items', expect => {
	const target = mutable({ items: [1, 2, 3, 4, 5] })

	merge(target, { items: [10, 20] })

	// merge does not remove, so tail remains
	expect(target.items).toEqual([10, 20, 3, 4, 5])
})

// --- reactivity preserved through merge ----------------------------------

await test('merge - triggers effects when nested values change', expect => {
	const state = mutable({ user: { name: 'Ada', age: 1 } })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.user.name)
		})
	})

	expect(seen).toEqual(['Ada'])

	merge(state, { user: { name: 'Grace' } })

	expect(seen).toEqual(['Ada', 'Grace'])
	expect(state.user.age).toBe(1) // unrelated key kept
})

// --- keyed array at a deeper path ----------------------------------------

await test('merge - keyed reconcile at a nested array path', expect => {
	const target = mutable({
		group: {
			users: [
				{ id: 1, name: 'Ada' },
				{ id: 2, name: 'Grace' },
			],
		},
	})

	const refAda = target.group.users[0]

	merge(
		target,
		{
			group: {
				users: [{ id: 1, role: 'admin' }],
			},
		},
		{ group: { users: { key: 'id' } } },
	)

	// Ada kept by reference and merged with new fields
	expect(target.group.users[0]).toBe(refAda)
	expect(target.group.users[0]).toEqual({
		id: 1,
		name: 'Ada',
		role: 'admin',
	})
})
