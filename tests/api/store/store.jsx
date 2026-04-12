/** @jsxImportSource pota */

// Tests for small pota/store helpers that don't warrant their own
// file: `firewall` and `updateBlacklist`.
import { test } from '#test'

import { root, signal } from 'pota'
import { firewall, mutable, updateBlacklist } from 'pota/store'

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

// --- firewall: multiple updates re-run the memo ---------------------------

await test('firewall - re-runs on each distinct signal update', expect => {
	const value = signal(0)
	let runs = 0

	root(() => {
		firewall(() => {
			runs++
			return value.read()
		})
	})

	expect(runs).toBe(1)

	value.write(1)
	value.write(2)
	value.write(3)

	expect(runs).toBe(4)
})

// --- firewall: writing the same value does not re-run --------------------

await test('firewall - writing the same value does not re-run', expect => {
	const value = signal(1)
	let runs = 0

	root(() => {
		firewall(() => {
			runs++
			return value.read()
		})
	})

	expect(runs).toBe(1)

	value.write(1)
	value.write(1)

	expect(runs).toBe(1)
})

// --- firewall: receives previous return value via usePrevious ------------

await test('firewall - invokes the function on each update and feeds back the previous return', expect => {
	const value = signal('a')
	const seen = []

	root(() => {
		firewall((next, previous) => {
			// just observe: we don't assume a specific value for
			// `previous` on the first call, only that by the time the
			// second invocation runs, `previous` has been seeded with
			// the first call's return value
			seen.push({ previous })
			return value.read()
		})
	})

	expect(seen.length).toBe(1)
	// first call: nothing has been returned yet, so previous is undefined
	expect(seen[0].previous).toBe(undefined)

	value.write('b')

	expect(seen.length).toBe(2)
	// second call: previous is the first call's return value ('a')
	expect(seen[1].previous).toBe('a')
})

// --- firewall: multiple independent signals track in one invocation ------

await test('firewall - tracks multiple independent signals together', expect => {
	const a = signal(1)
	const b = signal(10)
	const results = []

	root(() => {
		firewall(() => {
			const val = a.read() + b.read()
			results.push(val)
			return val
		})
	})

	expect(results).toEqual([11])

	a.write(2)
	expect(results).toEqual([11, 12])

	b.write(20)
	expect(results).toEqual([11, 12, 22])
})

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
