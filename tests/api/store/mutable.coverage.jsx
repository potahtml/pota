// Targeted tests for mutable proxy coverage gaps (array trackDiff
// add-branch, array toLocaleString, array keys() iterator, array
// fallback for methods not in arrayMethods, and Map/Set fallback
// branches for inherited methods).

import { test } from '#test'
import { mutable } from 'pota/store'

// array splice that GROWS triggers trackDiff's new-element add
// branch (key > oldLength → track.add).

await test('mutable array - splice that grows triggers add tracking for new indices', expect => {
	const arr = mutable([1])
	arr.splice(1, 0, 2, 3, 4)
	expect(arr.length).toBe(4)
	expect([...arr]).toEqual([1, 2, 3, 4])
})

// toLocaleString fallback in arrayMethods.

await test('mutable array - toLocaleString returns the built-in localized string', expect => {
	const arr = mutable([1, 2, 3])
	const expected = [1, 2, 3].toLocaleString()
	expect(arr.toLocaleString()).toBe(expected)
})

// keys() generator — covers the yield key path in the proxy.

await test('mutable array - keys() yields numeric indices', expect => {
	const arr = mutable(['a', 'b', 'c'])
	expect([...arr.keys()]).toEqual([0, 1, 2])
})

// Array method not in arrayMethods (e.g. flat, at) falls through
// to reflectApply — covers the `: reflectApply(value, target, args)`
// arm of the method-dispatch ternary.

// A method not in arrayMethods (e.g. a custom method added to an
// array instance) falls back to reflectApply — covers the `:`
// arm of the method-dispatch ternary in array's returnFunction.

await test('mutable array - custom method falls back to reflectApply', expect => {
	const src =
		/** @type {number[] & { customSum?: () => number }} */ ([1, 2, 3])
	src.customSum = function () {
		let s = 0
		for (let i = 0; i < this.length; i++) s += this[i]
		return s
	}
	const arr = /** @type {number[] & { customSum: () => number }} */ (
		mutable(src)
	)
	expect(arr.customSum()).toBe(6)
})

// Map/Set fallback branches — toString isn't in mapMethods/setMethods
// so it takes the reflectApply path.

await test('mutable Map - toString falls back to reflectApply', expect => {
	const m = mutable(new Map([['k', 'v']]))
	expect(m.toString()).toBe('[object Map]')
})

await test('mutable Set - toString falls back to reflectApply', expect => {
	const s = mutable(new Set([1, 2]))
	expect(s.toString()).toBe('[object Set]')
})

// Array.prototype.with() with a negative index — exercises the
// `key < 0 ? key + target.length : key` branch in the array proxy's
// `with` handler.

await test('mutable array - with() negative index resolves from end', expect => {
	const arr = mutable([10, 20, 30, 40])

	expect(arr.with(-1, 99)).toEqual([10, 20, 30, 99])
	expect(arr.with(-2, 88)).toEqual([10, 20, 88, 40])

	// positive index keeps working alongside (covered elsewhere;
	// here just to anchor that the branch resolves correctly in both
	// directions on the same proxy).
	expect(arr.with(0, 77)).toEqual([77, 20, 30, 40])
})

// Setting a blacklisted-and-not-yet-in-target key on a mutable
// proxy hits the `signalifyUndefinedKey` early-return path. Plain
// objects don't have `Symbol.iterator` (no prototype path), so the
// `!(key in target)` guard fires the call; well-known symbols are
// in the blacklist, so signalifyUndefinedKey returns immediately
// without installing accessors. reflectSet then records the value
// directly on the target.
//
// ('constructor' / '__proto__' don't reach this branch because they
// exist on the object prototype, so `key in target` is true and
// signalifyUndefinedKey is skipped earlier.)

await test('mutable - assigning a blacklisted symbol key skips signalification', expect => {
	const m = mutable({})

	const it = function* () {
		yield 1
		yield 2
	}
	m[Symbol.iterator] = it

	// `mutable()` wraps the value before reflectSet, so identity
	// isn't preserved; what we verify is:
	//
	//  - The own descriptor on the target is a *data* descriptor
	//    (no `get`/`set`), proving signalifyUndefinedKey returned
	//    early and did NOT install accessor wrapping.
	//  - Iteration via Symbol.iterator still works through the proxy.
	const desc = Object.getOwnPropertyDescriptor(m, Symbol.iterator)
	expect(desc).not.toBe(undefined)
	expect('value' in desc).toBe(true)
	expect('get' in desc).toBe(false)
	// @ts-expect-error
	expect([...m]).toEqual([1, 2])
})
