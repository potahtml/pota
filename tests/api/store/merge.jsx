/** @jsxImportSource pota */

// Tests for pota/store `merge`: deep merge, scalar writes, keyed
// arrays, type morphing, and empty sources.
import { test } from '#test'

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
	expect(target.data.key).toBe('value')
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
