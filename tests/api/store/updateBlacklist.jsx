/** @jsxImportSource pota */

// Tests for small pota/store helpers that don't warrant their own
// file: `updateBlacklist`.
import { test } from '#test'

import { mutable, updateBlacklist } from 'pota/store'

// --- updateBlacklist ------------------------------------------------------

// updateBlacklist's contract is `Window & typeof globalThis`, so the
// only meaningful check is that calling it against the real window
// twice is idempotent and leaves `constructorsTracked` (Object,
// Array, Map) still mutable afterwards.
await test('updateBlacklist - idempotent when called twice with window', expect => {
	expect(() => {
		updateBlacklist(window)
		updateBlacklist(window)
	}).not.toThrow()

	const state = mutable({
		a: 1,
		list: [1, 2],
		map: new Map([['k', 1]]),
	})

	expect(() => {
		state.a = 2
		state.list.push(3)
		state.map.set('k2', 2)
	}).not.toThrow()

	expect(state.a).toBe(2)
	expect(state.list).toEqual([1, 2, 3])
	expect(state.map.get('k2')).toBe(2)
})
