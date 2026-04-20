/** @jsxImportSource pota */

// Tests for pota/store `copy`: deep clones with support for cycles,
// Maps, and blacklisted built-ins.
import { test } from '#test'

import { copy } from 'pota/store'

import { isMutationBlacklisted } from '../../../src/lib/store/blacklist.js'

await test('copy - deep copies nested objects and arrays', expect => {
	const source = {
		user: {
			name: 'Ada',
			tags: ['a', 'b'],
		},
	}

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.user).not.toBe(source.user)
	expect(cloned.user.tags).not.toBe(source.user.tags)
	expect(cloned).toEqual(source)
})

await test('copy - preserves cycles and leaves built-ins intact', expect => {
	const source = { name: 'root', date: new Date('2020-01-01') }
	source.self = source

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.self).toBe(cloned)
	expect(cloned.date).toBe(source.date)
})

await test('copy - keeps blacklisted native instances by reference inside copied objects', expect => {
	const source = {
		map: new Map([['a', 1]]),
		ab: new ArrayBuffer(),
		nested: { ok: true },
	}

	expect(isMutationBlacklisted(new Map())).toBe(false)
	expect(isMutationBlacklisted(new ArrayBuffer())).toBe(true)

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.map).not.toBe(source.map)
	expect(cloned.ab).toBe(source.ab)
	expect(cloned.nested).not.toBe(source.nested)
})

await test('copy - deep copies Maps', expect => {
	const source = {
		lookup: new Map([['a', { value: 1 }]]),
	}

	const cloned = copy(source)

	expect(cloned.lookup).not.toBe(source.lookup)
	expect(cloned).toEqual(source)
})

// --- primitives are returned as-is ------------------------------------------

await test('copy - returns null unchanged', expect => {
	expect(copy(null)).toBe(null)
})

await test('copy - returns undefined unchanged', expect => {
	expect(copy(undefined)).toBe(undefined)
})

await test('copy - returns numbers unchanged', expect => {
	expect(copy(0)).toBe(0)
	expect(copy(42)).toBe(42)
	expect(copy(-1.5)).toBe(-1.5)
})

await test('copy - returns strings unchanged', expect => {
	expect(copy('')).toBe('')
	expect(copy('hello')).toBe('hello')
})

await test('copy - returns booleans unchanged', expect => {
	expect(copy(true)).toBe(true)
	expect(copy(false)).toBe(false)
})

// --- empty containers -------------------------------------------------------

await test('copy - empty object yields a new empty object', expect => {
	const source = {}
	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned).toEqual({})
})

await test('copy - empty array yields a new empty array', expect => {
	const source = []
	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(Array.isArray(cloned)).toBe(true)
	expect(cloned.length).toBe(0)
})

// --- blacklisted built-ins (Date, RegExp, ArrayBuffer already covered) -----

await test('copy - Date instances are not cloned', expect => {
	const source = { created: new Date('2020-01-01') }
	const cloned = copy(source)

	expect(cloned.created).toBe(source.created)
})

await test('copy - RegExp instances are not cloned', expect => {
	const source = { pattern: /foo/gi }
	const cloned = copy(source)

	expect(cloned.pattern).toBe(source.pattern)
})

// --- function values preserved by reference ---------------------------------

await test('copy - preserves function values by reference', expect => {
	const fn = () => 'hello'
	const source = { method: fn }
	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.method).toBe(fn)
	expect(cloned.method()).toBe('hello')
})

// --- deep structure ---------------------------------------------------------

await test('copy - deeply nested structures are fully independent', expect => {
	const source = {
		a: {
			b: {
				c: {
					d: { value: 'leaf' },
				},
			},
		},
	}

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.a).not.toBe(source.a)
	expect(cloned.a.b).not.toBe(source.a.b)
	expect(cloned.a.b.c).not.toBe(source.a.b.c)
	expect(cloned.a.b.c.d).not.toBe(source.a.b.c.d)
	expect(cloned.a.b.c.d.value).toBe('leaf')
})

await test('copy - array of objects copies each element independently', expect => {
	const source = [{ id: 1 }, { id: 2 }, { id: 3 }]
	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned[0]).not.toBe(source[0])
	expect(cloned[1]).not.toBe(source[1])
	expect(cloned[2]).not.toBe(source[2])
	expect(cloned).toEqual(source)
})

// --- mutating the copy does not touch the source ---------------------------

await test('copy - mutating the copy does not affect the source', expect => {
	const source = {
		user: { name: 'Ada', tags: ['a', 'b'] },
	}

	const cloned = copy(source)
	cloned.user.name = 'Grace'
	cloned.user.tags.push('c')

	expect(source.user.name).toBe('Ada')
	expect(source.user.tags).toEqual(['a', 'b'])
	expect(cloned.user.name).toBe('Grace')
	expect(cloned.user.tags).toEqual(['a', 'b', 'c'])
})

// --- shared references in source become separate in copy -------------------

await test('copy - shared references in source become independent in copy', expect => {
	const shared = { count: 1 }
	const source = {
		first: shared,
		second: shared,
	}

	const cloned = copy(source)

	// Both copies of "shared" now point to the same cloned object (seen
	// cache ensures structural identity is preserved across a copy).
	expect(cloned.first).toBe(cloned.second)
	expect(cloned.first).not.toBe(shared)
})

// --- cycles across siblings ------------------------------------------------

await test('copy - preserves cycles between sibling nodes', expect => {
	const source = { name: 'root' }
	source.left = { name: 'left', parent: source }
	source.right = { name: 'right', parent: source }

	const cloned = copy(source)

	expect(cloned).not.toBe(source)
	expect(cloned.left.parent).toBe(cloned)
	expect(cloned.right.parent).toBe(cloned)
	expect(cloned.left).not.toBe(source.left)
})
