/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "Set composition
// methods untracked, generators lack per-yield subscriptions". The
// ES2025 composition methods (union, intersection, difference,
// symmetricDifference, isSubsetOf, isSupersetOf, isDisjointFrom)
// fell through the generic apply with no tracking, and the
// values/keys/entries generators only subscribed after full
// iteration — a `break` left zero subscriptions. Fixed: composition
// methods subscribe via the coarse `valuesRead`; generators do a
// per-element `keyRead` at each yield (the same signal `has` and
// `delete` use), matching the Map generators' design.

import { test } from '#test'
import { root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

await test('union() re-runs when the set changes', expect => {
	const state = mutable({ tags: new Set([1]) })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push([...state.tags.union(new Set([2]))].join(','))
		})
	})

	expect(seen).toEqual(['1,2'])

	// receiver elements come first in the union's insertion order
	state.tags.add(3)
	expect(seen).toEqual(['1,2', '1,3,2'])

	state.tags.delete(1)
	expect(seen).toEqual(['1,2', '1,3,2', '3,2'])
})

await test('intersection() and isSubsetOf() re-run on changes', expect => {
	const state = mutable({ tags: new Set([1, 2]) })
	const inter = []
	const subset = []

	root(() => {
		syncEffect(() => {
			inter.push(state.tags.intersection(new Set([2, 3])).size)
		})
		syncEffect(() => {
			subset.push(state.tags.isSubsetOf(new Set([1, 2, 3])))
		})
	})

	expect(inter).toEqual([1])
	expect(subset).toEqual([true])

	state.tags.add(3)
	expect(inter).toEqual([1, 2])
	expect(subset).toEqual([true, true])

	state.tags.add(9)
	expect(subset).toEqual([true, true, false])
})

await test('composition methods track a proxied argument too', expect => {
	const state = mutable({ a: new Set([1]), b: new Set([2]) })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.a.union(state.b).size)
		})
	})

	expect(seen).toEqual([2])

	// change the argument set — tracked through its own proxy traps
	state.b.add(3)
	expect(seen).toEqual([2, 3])
})

await test('partial iteration with break stays reactive', expect => {
	const state = mutable({ tags: new Set(['a', 'b', 'c']) })
	const seen = []

	root(() => {
		syncEffect(() => {
			for (const v of state.tags.values()) {
				seen.push(v)
				break
			}
		})
	})

	expect(seen).toEqual(['a'])

	// deleting the yielded element re-runs the effect
	state.tags.delete('a')
	expect(seen).toEqual(['a', 'b'])
})
