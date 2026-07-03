/** @jsxImportSource pota */
// REGRESSION — documentation/improvements.md: "Map
// getOrInsert/getOrInsertComputed fall through untracked". The
// ES2026 upsert methods weren't in `mapMethods`, so on engines that
// ship them the insert went unnotified and stored the raw value
// unwrapped. Fixed: both delegate their write bookkeeping to the
// `set` handler and subscribe to the key's value like `get`. The
// handlers are inert on engines without the methods — these tests
// no-op there.

import { test } from '#test'
import { root, syncEffect } from 'pota'
import { mutable } from 'pota/store'

const supported = typeof Map.prototype.getOrInsert === 'function'

await test('getOrInsert notifies size and wraps the inserted value', expect => {
	if (!supported) return

	const state = mutable({ m: new Map() })
	const sizes = []

	root(() => {
		syncEffect(() => {
			sizes.push(state.m.size)
		})
	})

	expect(sizes).toEqual([0])

	const inserted = state.m.getOrInsert('k', { a: 1 })
	expect(sizes).toEqual([0, 1])

	// the stored value is the mutable proxy, same as get returns
	expect(inserted).toBe(state.m.get('k'))

	// present key: returns the existing value, no size change
	expect(state.m.getOrInsert('k', { a: 2 })).toBe(inserted)
	expect(sizes).toEqual([0, 1])
})

await test('getOrInsert subscribes to the key like get', expect => {
	if (!supported) return

	const state = mutable({ m: new Map() })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.m.getOrInsert('k', 'default'))
		})
	})

	expect(seen).toEqual(['default'])

	state.m.set('k', 'changed')
	expect(seen).toEqual(['default', 'changed'])
})

await test('getOrInsertComputed inserts the computed value once', expect => {
	if (
		!supported ||
		typeof Map.prototype.getOrInsertComputed !== 'function'
	) {
		return
	}

	const state = mutable({ m: new Map() })
	let calls = 0

	const v = state.m.getOrInsertComputed('k', () => {
		calls++
		return { a: 1 }
	})

	expect(calls).toBe(1)
	expect(v).toBe(state.m.get('k'))

	state.m.getOrInsertComputed('k', () => {
		calls++
		return { a: 2 }
	})
	expect(calls).toBe(1)
})
