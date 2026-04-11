/** @jsxImportSource pota */

// Tests for pota/store `project`: copy-on-write views over mutable
// sources, including arrays, functions, and proxy identity.
import { test } from '#test'

import { mutable, project } from 'pota/store'

await test('project - creates a copy-on-write view for nested objects and arrays', expect => {
	const source = mutable({
		user: { name: 'Ada', stats: { visits: 1 } },
		tags: ['a', 'b'],
	})

	const view = project(source)

	view.user.name = 'Grace'
	view.user.stats.visits = 2
	view.tags.push('c')

	expect(source.user.name).toBe('Ada')
	expect(source.user.stats.visits).toBe(1)
	expect(source.tags).toEqual(['a', 'b'])

	expect(view.user.name).toBe('Grace')
	expect(view.user.stats.visits).toBe(2)
	expect(view.tags).toEqual(['a', 'b', 'c'])
})

await test('project - still reads through to source keys until overridden', expect => {
	const source = mutable({
		nested: { value: 1 },
		plain: 'from source',
	})

	const view = project(source)

	expect(view.plain).toBe('from source')
	expect(view.nested.value).toBe(1)

	view.plain = 'from projection'

	expect(source.plain).toBe('from source')
	expect(view.plain).toBe('from projection')
})

await test('project - reuses the same projection proxy for the same nested source object', expect => {
	const source = mutable({
		nested: { value: 1 },
	})

	const first = project(source)
	const second = project(source)

	expect(first).not.toBe(second)
	expect(first.nested).not.toBe(second.nested)
})

await test('project - wraps functions to return projected results', expect => {
	const source = mutable({
		items: [1, 2, 3],
		getItems() {
			return this.items
		},
	})

	const view = project(source)

	view.items.push(4)

	// source is unaffected
	expect(source.items).toEqual([1, 2, 3])
	expect(view.items).toEqual([1, 2, 3, 4])
})

await test('project - array mutations do not affect source', expect => {
	const source = mutable({ list: ['a', 'b'] })
	const view = project(source)

	view.list.push('c')
	view.list[0] = 'z'

	expect(source.list).toEqual(['a', 'b'])
	expect(view.list).toEqual(['z', 'b', 'c'])
})
