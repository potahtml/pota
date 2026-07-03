/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "Map keys not
// normalized". Wrap-time keys stayed raw while values were proxied,
// and the method handlers didn't `mutable()` the key argument (Set
// normalizes its values everywhere) — so `has`/`get` with the proxy
// of a raw wrap-time key missed the entry. Fixed: keys are
// normalized with `mutable()` at wrap time (entries rebuilt to
// preserve insertion order) and in every keyed method, so raw and
// proxy lookups agree and `keys()` yields the proxies, consistent
// with values.

import { test } from '#test'
import { root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

await test('raw and proxy key lookups agree', expect => {
	const keyObj = { id: 1 }
	const state = mutable({ m: new Map([[keyObj, 'v']]), keyObj })

	// both identities resolve to the same entry
	expect(state.m.has(state.keyObj)).toBe(true)
	expect(state.m.has(keyObj)).toBe(true)
	expect(state.m.get(state.keyObj)).toBe('v')
	expect(state.m.get(keyObj)).toBe('v')
})

await test('keys() yields the proxy, consistent with values', expect => {
	const keyObj = { id: 1 }
	const state = mutable({ m: new Map([[keyObj, 'v']]), keyObj })

	const keys = [...state.m.keys()]
	expect(keys.length).toBe(1)
	expect(keys[0]).toBe(state.keyObj)
})

await test('set with raw key, delete with proxy key', expect => {
	const keyObj = { id: 2 }
	const state = mutable({ m: new Map(), keyObj })

	state.m.set(keyObj, 'x')
	expect(state.m.size).toBe(1)
	expect(state.m.get(state.keyObj)).toBe('x')

	expect(state.m.delete(state.keyObj)).toBe(true)
	expect(state.m.size).toBe(0)
})

await test('subscriptions made via proxy key wake on writes via raw key', expect => {
	const keyObj = { id: 3 }
	const state = mutable({ m: new Map(), keyObj })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.m.get(state.keyObj))
		})
	})

	expect(seen).toEqual([undefined])

	state.m.set(keyObj, 'hello')
	expect(seen).toEqual([undefined, 'hello'])
})
