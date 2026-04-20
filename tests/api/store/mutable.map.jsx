/** @jsxImportSource pota */

/**
 * Map-specific coverage for the mutable store — focusing on precision:
 * memos reading `map.get(k)` or `map.has(k)` should only re-run when
 * THAT key's state changes, not on any map mutation.
 *
 * Known limitation: per-key tracking coerces non-primitive keys via
 * `#props[key]` to string (`"[object Object]"`), so different object
 * keys collide. Primitive keys (strings, numbers, symbols) work.
 */

import { test as _test } from '#test'

import { syncEffect as effect, memo } from 'pota'
import { mutable } from 'pota/store'

const test = _test

/* ------------------------------------------------------------------ */
/*  A. Fine-grained tracking with primitive keys                       */
/* ------------------------------------------------------------------ */

await test('map precision: map.get(k1) does not re-fire on map.set(k2, ...)', expect => {
	const m = mutable(new Map([['a', 1], ['b', 2]]))
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get('a')
	})
	expect(mg()).toBe(1)
	expect(calls).toBe(1)

	m.set('b', 20)
	expect(mg()).toBe(1)
	expect(calls).toBe(1)

	m.set('c', 3)
	expect(mg()).toBe(1)
	expect(calls).toBe(1)
})

await test('map precision: map.has(k1) does not re-fire on map.set(k2, ...)', expect => {
	const m = mutable(new Map())
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.has('a')
	})
	expect(mg()).toBe(false)
	expect(calls).toBe(1)

	m.set('b', 2)
	expect(mg()).toBe(false)
	expect(calls).toBe(1)

	m.set('a', 1)
	expect(mg()).toBe(true)
	expect(calls).toBe(2)
})

await test('map precision: map.get(k) same-value write is a no-op', expect => {
	const m = mutable(new Map([['a', 1]]))
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get('a')
	})
	expect(mg()).toBe(1)
	expect(calls).toBe(1)

	m.set('a', 1)
	expect(mg()).toBe(1)
	expect(calls).toBe(1)
})

await test('map precision: map.delete(k2) does not wake map.get(k1) memo', expect => {
	const m = mutable(new Map([['a', 1], ['b', 2]]))
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get('a')
	})
	expect(mg()).toBe(1)
	expect(calls).toBe(1)

	m.delete('b')
	expect(mg()).toBe(1)
	expect(calls).toBe(1)
})

await test('map precision: map.delete(nonexistent) is a no-op for reactivity', expect => {
	const m = mutable(new Map([['a', 1]]))
	let sizeCalls = 0
	const ms = memo(() => {
		sizeCalls++
		return m.size
	})
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)

	m.delete('x')
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)
})

await test('map precision: size does not re-fire on same-value set', expect => {
	const m = mutable(new Map([['a', 1]]))
	let sizeCalls = 0
	const ms = memo(() => {
		sizeCalls++
		return m.size
	})
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)

	m.set('a', 1)
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  B. Object keys — known coarse limitation                           */
/* ------------------------------------------------------------------ */

await test('map precision: object keys tracked by identity', expect => {
	// Per-key Signal Map in ProxyHandlerMap keeps object keys
	// identity-precise; the tracker's #props coercion is bypassed.
	const k1 = {}
	const k2 = {}
	const m = mutable(new Map())
	m.set(k1, 'a')

	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get(k1)
	})
	expect(mg()).toBe('a')
	expect(calls).toBe(1)

	m.set(k2, 'b')
	expect(mg()).toBe('a')
	expect(calls).toBe(1)
})

await test('map precision: clear wakes every per-key get and has memo currently in the map', expect => {
	const m = mutable(new Map([['a', 1], ['b', 2], ['c', 3]]))

	let aGetCalls = 0
	let aHasCalls = 0
	let bGetCalls = 0
	let zHasCalls = 0

	const mAGet = memo(() => {
		aGetCalls++
		return m.get('a')
	})
	const mAHas = memo(() => {
		aHasCalls++
		return m.has('a')
	})
	const mBGet = memo(() => {
		bGetCalls++
		return m.get('b')
	})
	// 'z' was never in the map — should NOT wake on clear.
	const mZHas = memo(() => {
		zHasCalls++
		return m.has('z')
	})
	mAGet()
	mAHas()
	mBGet()
	mZHas()
	expect(aGetCalls).toBe(1)
	expect(aHasCalls).toBe(1)
	expect(bGetCalls).toBe(1)
	expect(zHasCalls).toBe(1)

	m.clear()
	mAGet()
	mAHas()
	mBGet()
	mZHas()

	// Keys that were in the map see their per-key signals flip.
	expect(aGetCalls).toBe(2)
	expect(aHasCalls).toBe(2)
	expect(bGetCalls).toBe(2)
	expect(mAGet()).toBe(undefined)
	expect(mAHas()).toBe(false)
	expect(mBGet()).toBe(undefined)

	// 'z' was never in the map — stays stable.
	expect(zHasCalls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  C. Iteration subscribers fire on any change                        */
/* ------------------------------------------------------------------ */

await test('map precision: forEach memo re-runs on any set/delete', expect => {
	const m = mutable(new Map([['a', 1]]))
	let calls = 0
	const mg = memo(() => {
		calls++
		let total = 0
		m.forEach(v => (total += v))
		return total
	})
	mg()
	expect(mg()).toBe(1)
	expect(calls).toBe(1)

	m.set('b', 2)
	mg()
	expect(mg()).toBe(3)
	expect(calls).toBe(2)

	m.delete('a')
	mg()
	expect(mg()).toBe(2)
	expect(calls).toBe(3)
})

await test('map precision: forEach respects thisArg binding', expect => {
	const m = mutable(new Map([['a', 1]]))
	const thisArg = { tag: 'x' }
	let seen
	m.forEach(function (value, key, map) {
		seen = { t: this, value, key, map }
	}, thisArg)
	expect(seen.t).toBe(thisArg)
	expect(seen.value).toBe(1)
	expect(seen.key).toBe('a')
	expect(seen.map).toBe(m)
})
