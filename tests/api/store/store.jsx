/** @jsxImportSource pota */

// Tests for small pota/store helpers that don't warrant their own
// file: `firewall` and `updateBlacklist`.
import { test } from '#test'

import { root, signal } from 'pota'
import { firewall, updateBlacklist } from 'pota/store'

await test('firewall - can observe reactive changes without throwing', expect => {
	const count = signal(1)
	let runs = 0

	root(() => {
		firewall(() => {
			runs++
			return count.read()
		})
	})

	expect(runs).toBe(1)

	count.write(2)

	expect(runs).toBe(2)
})

await test('updateBlacklist - accepts a window-like object and keeps tracked constructors writable', expect => {
	expect(() =>
		updateBlacklist({
			Object,
			Array,
			Map,
			Symbol,
			CustomThing: class CustomThing {},
		}),
	).not.toThrow()
})
