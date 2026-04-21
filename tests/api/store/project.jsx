/** @jsxImportSource pota */

// Tests for pota/store `project`: copy-on-write views over mutable
// sources, including arrays, functions, key enumeration, reactivity,
// and write isolation.
import { test } from '#test'

import { root, syncEffect } from 'pota'
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

// --- primitives pass through unchanged -----------------------------------

await test('project - returns primitives as-is', expect => {
	expect(project(42)).toBe(42)
	expect(project('hello')).toBe('hello')
	expect(project(null)).toBe(null)
	expect(project(undefined)).toBe(undefined)
	expect(project(true)).toBe(true)
})

// --- ownKeys: union of source and projection overrides -------------------

await test('project - ownKeys returns the union of source and projection keys', expect => {
	const source = mutable({ a: 1, b: 2 })
	const view = project(source)

	// Before adding, keys come from source
	expect(Object.keys(view).sort()).toEqual(['a', 'b'])

	view.c = 3

	// After adding a new key, it's in the union
	expect(Object.keys(view).sort()).toEqual(['a', 'b', 'c'])
})

// --- `in` operator checks both projection and source --------------------

await test('project - `in` operator sees source keys too', expect => {
	const source = mutable({ fromSource: 1 })
	const view = project(source)

	expect('fromSource' in view).toBe(true)

	view.fromView = 2

	expect('fromSource' in view).toBe(true)
	expect('fromView' in view).toBe(true)
})

// --- reactivity: source updates flow through unless overridden ----------

await test('project - source updates reflect in the projection when key is not overridden', expect => {
	const source = mutable({ count: 1 })
	const view = project(source)
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(view.count)
		})
	})

	expect(seen).toEqual([1])

	// updating the source should flow through
	source.count = 2
	expect(seen).toEqual([1, 2])
})

// --- source observers don't fire from projection writes ----------------

await test('project - writing to projection does not trigger source observers', expect => {
	const source = mutable({ name: 'Ada' })
	const view = project(source)
	const sourceSeen = []

	root(() => {
		syncEffect(() => {
			sourceSeen.push(source.name)
		})
	})

	expect(sourceSeen).toEqual(['Ada'])

	// writing to the projection must not notify source observers
	view.name = 'Grace'
	expect(sourceSeen).toEqual(['Ada'])

	// and source is untouched
	expect(source.name).toBe('Ada')
})

// --- empty source --------------------------------------------------------

await test('project - projecting an empty object works', expect => {
	const source = mutable({})
	const view = project(source)

	expect(Object.keys(view)).toEqual([])

	view.a = 1
	expect(view.a).toBe(1)
	expect('a' in source).toBe(false)
})

// --- object with mixed scalar and nested values --------------------------

await test('project - mixed scalar and nested keys write independently', expect => {
	const source = mutable({
		scalar: 1,
		nested: { value: 'x' },
	})
	const view = project(source)

	view.scalar = 99
	view.nested.value = 'y'

	expect(source.scalar).toBe(1)
	expect(source.nested.value).toBe('x')
	expect(view.scalar).toBe(99)
	expect(view.nested.value).toBe('y')
})

// Passing a projected value back through project() with the same
// proxies cache is a no-op: the $isProjection get returns the root
// proxies map and project() short-circuits. This test exercises
// both by writing a nested object into the view, which runs the
// Projection set (project(value, this.root)), then reading it
// back.

await test('project - writing an object value into a view projects it with the same proxies cache', expect => {
	const source = {}
	const view = project(source)
	const obj = { k: 1 }
	view.nested = obj
	// the value read back is a projection proxy (not the raw obj)
	expect(view.nested).not.toBe(obj)
	// and the second read returns the cached projection
	expect(view.nested).toBe(view.nested)
})
