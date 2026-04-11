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
		lookup: new Map([
			['a', { value: 1 }],
		]),
	}

	const cloned = copy(source)

	expect(cloned.lookup).not.toBe(source.lookup)
	expect(cloned).toEqual(source)
})
