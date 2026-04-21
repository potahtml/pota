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
	const src = /** @type {number[] & { customSum?: () => number }} */ (
		[1, 2, 3]
	)
	src.customSum = function () {
		let s = 0
		for (let i = 0; i < this.length; i++) s += this[i]
		return s
	}
	const arr =
		/** @type {number[] & { customSum: () => number }} */ (
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
