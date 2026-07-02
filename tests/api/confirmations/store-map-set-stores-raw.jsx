// BUG CONFIRMATION — documentation/improvements.md: "Map proxy `set`
// stores the raw value, not the mutable proxy". mapMethods.set
// computes `val = mutable(args[1])` but applies the original args,
// so post-wrap entries hold raws while wrap-time entries hold
// proxies: iteration yields untracked raw objects and the no-op set
// check never matches for objects. Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { isProxy } from 'pota/use/test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('CONFIRM - iteration yields proxies for wrap-time entries, raws for set() entries', expect => {
	const m = mutable(new Map([['init', { n: 1 }]]))
	m.set('later', { n: 2 })

	const kinds = []
	m.forEach((v, k) => kinds.push([k, isProxy(v)]))

	// BUG: the entry added through the proxy stores the raw object
	expect(kinds).toEqual([
		['init', true],
		['later', false],
	])
	// FIXED: expect(kinds).toEqual([['init', true], ['later', true]])
})

await test('CONFIRM - values from iteration lose reactivity for new nested keys', expect => {
	// control: wrap-time entry — iteration yields the proxy, so an
	// absent-key read is tracked and the effect re-runs on write
	const control = mutable(
		new Map([['k', /** @type {{ later?: number }} */ ({})]]),
	)
	let controlSeen
	const disposeControl = root(d => {
		effect(() => {
			for (const [, v] of control) controlSeen = v.later
		})
		return d
	})
	expect(controlSeen).toBe(undefined)
	const controlEntry = /** @type {{ later?: number }} */ (
		control.get('k')
	)
	controlEntry.later = 1
	expect(controlSeen).toBe(1)
	disposeControl()

	// bug: entry added via set() — iteration yields the raw object,
	// the absent-key read is untracked, the effect never re-runs
	const m = mutable(new Map())
	m.set('k', {})
	let seen
	const dispose = root(d => {
		effect(() => {
			for (const [, v] of m) seen = v.later
		})
		return d
	})
	expect(seen).toBe(undefined)
	m.get('k').later = 1

	// BUG: still undefined — the raw value bypassed the proxy traps
	expect(seen).toBe(undefined)
	// FIXED: expect(seen).toBe(1)

	dispose()
})

await test('CONFIRM - same-value set() of an object spuriously wakes iteration subscribers', expect => {
	const raw = { n: 1 }
	const m = mutable(new Map())
	m.set('k', raw)

	let runs = 0
	const dispose = root(d => {
		effect(() => {
			m.forEach(() => {})
			runs++
		})
		return d
	})
	expect(runs).toBe(1)

	// semantically a no-op: same key, same value
	m.set('k', raw)

	// BUG: the no-op check compares the stored raw against the
	// mutable proxy, never matches, and valuesWrite() always fires
	expect(runs).toBe(2)
	// FIXED: expect(runs).toBe(1)

	// primitives take the intended early return today (control)
	m.set('p', 5)
	expect(runs).toBe(3)
	m.set('p', 5)
	expect(runs).toBe(3)

	dispose()
})
