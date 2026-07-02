// REGRESSION — documentation/improvements.md: "Map proxy `set` stores
// the raw value, not the mutable proxy". mapMethods.set used to
// compute `val = mutable(args[1])` but apply the original args, so
// post-wrap entries held raws while wrap-time entries held proxies:
// iteration yielded untracked raw objects and the no-op set check
// never matched for objects. Fixed: set applies `[key, val]`, and the
// no-op path returns without re-applying (mutable() is idempotent, so
// same raw ⇒ same proxy ⇒ the equality check holds).

import { test } from '#test'
import { isProxy } from 'pota/use/test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('iteration yields proxies for both wrap-time and set() entries', expect => {
	const m = mutable(new Map([['init', { n: 1 }]]))
	m.set('later', { n: 2 })

	const kinds = []
	m.forEach((v, k) => kinds.push([k, isProxy(v)]))

	expect(kinds).toEqual([
		['init', true],
		['later', true],
	])
})

await test('values from iteration stay reactive for new nested keys', expect => {
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

	// entry added via set() behaves the same: iteration yields the
	// proxy, the absent-key read is tracked, the effect re-runs
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
	expect(seen).toBe(1)

	dispose()
})

await test('same-value set() of an object is a no-op for subscribers', expect => {
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

	// same key, same value — mutable() returns the cached proxy, the
	// no-op check matches, no write fires
	m.set('k', raw)
	expect(runs).toBe(1)

	// setting the stored proxy itself is also a no-op
	m.set('k', m.get('k'))
	expect(runs).toBe(1)

	// primitives take the same early return (control)
	m.set('p', 5)
	expect(runs).toBe(2)
	m.set('p', 5)
	expect(runs).toBe(2)

	dispose()
})

await test('set() returns the map for chaining', expect => {
	const m = mutable(new Map())
	const r = m.set('a', 1).set('b', 2)
	expect(r).toBe(m)
	expect(m.get('b')).toBe(2)

	// no-op set also chains
	expect(m.set('a', 1)).toBe(m)
})
