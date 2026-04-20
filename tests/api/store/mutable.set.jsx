/** @jsxImportSource pota */

/**
 * Set-specific coverage for the mutable store.
 *
 * Sets are tracked coarsely: any `add` / `delete` / `clear` fires the
 * trackSlot's Values sentinel, invalidating any `has` / iteration /
 * `forEach` read. Per-value membership tracking would require keying
 * the tracker by value identity, which can't be done for object
 * values with the current tracker layout.
 */

import { test as _test } from '#test'
import { isProxy } from 'pota/use/test'

import { syncEffect as effect, memo } from 'pota'
import { mutable } from 'pota/store'

const test = _test

/* ------------------------------------------------------------------ */
/*  A. Identity / basic reactivity                                     */
/* ------------------------------------------------------------------ */

await test('set: mutable(new Set()) returns a proxy that is still a Set', expect => {
	const s = mutable(new Set())
	expect(isProxy(s)).toBe(true)
	expect(s instanceof Set).toBe(true)
	expect(s.constructor).toBe(Set)
})

await test('set: initial contents are preserved and iterable', expect => {
	const s = mutable(new Set([1, 2, 3]))
	expect(s.size).toBe(3)
	expect([...s]).toEqual([1, 2, 3])
})

await test('set: add returns the set proxy', expect => {
	const s = mutable(new Set())
	const r = s.add(1)
	expect(r).toBe(s)
	expect(s.size).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  B. Size reactivity                                                 */
/* ------------------------------------------------------------------ */

await test('set: size subscribers re-run on add / delete / clear', expect => {
	const s = mutable(new Set([1, 2]))
	let calls = 0
	let size
	const m = memo(() => {
		calls++
		size = s.size
	})
	m()
	expect(calls).toBe(1)
	expect(size).toBe(2)

	s.add(3)
	m()
	expect(calls).toBe(2)
	expect(size).toBe(3)

	s.delete(3)
	m()
	expect(calls).toBe(3)
	expect(size).toBe(2)

	s.clear()
	m()
	expect(calls).toBe(4)
	expect(size).toBe(0)
})

await test('set: size does not re-fire on redundant add (value already in)', expect => {
	const s = mutable(new Set([1]))
	let calls = 0
	const m = memo(() => {
		calls++
		return s.size
	})
	expect(m()).toBe(1)
	expect(calls).toBe(1)

	s.add(1)
	expect(m()).toBe(1)
	expect(calls).toBe(1)
})

await test('set: size does not re-fire on delete of missing value', expect => {
	const s = mutable(new Set([1]))
	let calls = 0
	const m = memo(() => {
		calls++
		return s.size
	})
	expect(m()).toBe(1)
	expect(calls).toBe(1)

	s.delete(99)
	expect(m()).toBe(1)
	expect(calls).toBe(1)
})

await test('set: clear on empty set is a no-op for reactivity', expect => {
	const s = mutable(new Set())
	let calls = 0
	const m = memo(() => {
		calls++
		return s.size
	})
	expect(m()).toBe(0)
	expect(calls).toBe(1)

	s.clear()
	expect(m()).toBe(0)
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  C. `has` reactivity (coarse)                                      */
/* ------------------------------------------------------------------ */

await test('set: has subscribers re-run when target value is added', expect => {
	const s = mutable(new Set())
	let calls = 0
	let hasA
	const m = memo(() => {
		calls++
		hasA = s.has('a')
	})
	m()
	expect(calls).toBe(1)
	expect(hasA).toBe(false)

	s.add('a')
	m()
	expect(calls).toBe(2)
	expect(hasA).toBe(true)
})

await test('set: has subscribers re-run when target value is deleted', expect => {
	const s = mutable(new Set(['a']))
	let calls = 0
	let hasA
	const m = memo(() => {
		calls++
		hasA = s.has('a')
	})
	m()
	expect(calls).toBe(1)
	expect(hasA).toBe(true)

	s.delete('a')
	m()
	expect(calls).toBe(2)
	expect(hasA).toBe(false)
})

await test('set: has tracking is per-value (unrelated additions do NOT re-fire)', expect => {
	// Per-value precision: adding 'b' does not wake up a memo reading
	// has('a'). Membership signals are keyed by value identity.
	const s = mutable(new Set())
	let calls = 0
	const m = memo(() => {
		calls++
		return s.has('a')
	})
	expect(m()).toBe(false)
	expect(calls).toBe(1)

	s.add('b')
	expect(m()).toBe(false)
	expect(calls).toBe(1)

	// Adding the target value does fire.
	s.add('a')
	expect(m()).toBe(true)
	expect(calls).toBe(2)
})

/* ------------------------------------------------------------------ */
/*  D. Iteration reactivity                                            */
/* ------------------------------------------------------------------ */

await test('set: forEach subscribers re-run on add', expect => {
	const s = mutable(new Set([1]))
	let calls = 0
	let seen
	const m = memo(() => {
		calls++
		seen = []
		s.forEach(v => seen.push(v))
	})
	m()
	expect(calls).toBe(1)
	expect(seen).toEqual([1])

	s.add(2)
	m()
	expect(calls).toBe(2)
	expect(seen).toEqual([1, 2])
})

await test('set: values() generator re-runs subscriber on add', expect => {
	const s = mutable(new Set([1]))
	let calls = 0
	let seen
	const m = memo(() => {
		calls++
		seen = [...s.values()]
	})
	m()
	expect(calls).toBe(1)
	expect(seen).toEqual([1])

	s.add(2)
	m()
	expect(calls).toBe(2)
	expect(seen).toEqual([1, 2])
})

await test('set: keys() === values() (Set.prototype.keys is an alias)', expect => {
	const s = mutable(new Set(['a', 'b']))
	expect([...s.keys()]).toEqual(['a', 'b'])
	expect([...s.values()]).toEqual(['a', 'b'])
})

await test('set: entries() yields [v, v] pairs', expect => {
	const s = mutable(new Set([1, 2]))
	const entries = [...s.entries()]
	expect(entries).toEqual([
		[1, 1],
		[2, 2],
	])
})

await test('set: for-of iterates via [Symbol.iterator]', expect => {
	const s = mutable(new Set([10, 20, 30]))
	const collected = []
	for (const v of s) collected.push(v)
	expect(collected).toEqual([10, 20, 30])
})

/* ------------------------------------------------------------------ */
/*  E. Object values                                                   */
/* ------------------------------------------------------------------ */

await test('set: object values are wrapped as mutables on initial load', expect => {
	const a = { id: 1 }
	const b = { id: 2 }
	const s = mutable(new Set([a, b]))
	const arr = [...s]
	expect(arr.length).toBe(2)
	expect(isProxy(arr[0])).toBe(true)
	expect(isProxy(arr[1])).toBe(true)
})

await test('set: add(obj) wraps the object before insertion', expect => {
	const s = mutable(new Set())
	const obj = { id: 42 }
	s.add(obj)
	const arr = [...s]
	expect(arr.length).toBe(1)
	expect(isProxy(arr[0])).toBe(true)
})

/* ------------------------------------------------------------------ */
/*  F. Iterator mid-mutation (native semantics)                        */
/* ------------------------------------------------------------------ */

await test('set: iterator sees values added after iteration started', expect => {
	const s = mutable(new Set([1, 2]))
	const it = s.values()
	expect(it.next().value).toBe(1)

	s.add(3)

	expect(it.next().value).toBe(2)
	expect(it.next().value).toBe(3)
	expect(it.next().done).toBe(true)
})

await test('set: iterator skips values deleted before they are visited', expect => {
	const s = mutable(new Set([1, 2, 3]))
	const it = s.values()
	expect(it.next().value).toBe(1)

	s.delete(2)

	expect(it.next().value).toBe(3)
	expect(it.next().done).toBe(true)
})

/* ------------------------------------------------------------------ */
/*  G. Fine-grained tracking precision                                 */
/* ------------------------------------------------------------------ */

await test('set precision: two memos on different values — only the affected one wakes', expect => {
	const s = mutable(new Set())
	let aCalls = 0
	let bCalls = 0
	const mA = memo(() => {
		aCalls++
		return s.has('a')
	})
	const mB = memo(() => {
		bCalls++
		return s.has('b')
	})
	expect(mA()).toBe(false)
	expect(mB()).toBe(false)
	expect(aCalls).toBe(1)
	expect(bCalls).toBe(1)

	s.add('a')
	expect(mA()).toBe(true)
	expect(mB()).toBe(false)
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(1)

	s.add('b')
	expect(mA()).toBe(true)
	expect(mB()).toBe(true)
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(2)

	s.delete('a')
	expect(mA()).toBe(false)
	expect(mB()).toBe(true)
	expect(aCalls).toBe(3)
	expect(bCalls).toBe(2)
})

await test('set precision: redundant add does NOT wake has memo', expect => {
	const s = mutable(new Set(['a']))
	let calls = 0
	const m = memo(() => {
		calls++
		return s.has('a')
	})
	expect(m()).toBe(true)
	expect(calls).toBe(1)

	s.add('a')
	expect(m()).toBe(true)
	expect(calls).toBe(1)
})

await test('set precision: delete of missing value does NOT wake has memo', expect => {
	const s = mutable(new Set())
	let calls = 0
	const m = memo(() => {
		calls++
		return s.has('a')
	})
	expect(m()).toBe(false)
	expect(calls).toBe(1)

	s.delete('a')
	expect(m()).toBe(false)
	expect(calls).toBe(1)

	s.delete('b')
	expect(m()).toBe(false)
	expect(calls).toBe(1)
})

await test('set precision: object values tracked by identity (no collision)', expect => {
	const a = { id: 1 }
	const b = { id: 2 }
	const s = mutable(new Set())
	let aCalls = 0
	let bCalls = 0
	const mA = memo(() => {
		aCalls++
		return s.has(a)
	})
	const mB = memo(() => {
		bCalls++
		return s.has(b)
	})
	expect(mA()).toBe(false)
	expect(mB()).toBe(false)
	expect(aCalls).toBe(1)
	expect(bCalls).toBe(1)

	s.add(a)
	expect(mA()).toBe(true)
	expect(mB()).toBe(false)
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(1)
})

await test('set precision: size memo does NOT fire on same-state mutations', expect => {
	const s = mutable(new Set(['a']))
	let sizeCalls = 0
	const ms = memo(() => {
		sizeCalls++
		return s.size
	})
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)

	s.add('a')
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)

	s.delete('b')
	expect(ms()).toBe(1)
	expect(sizeCalls).toBe(1)
})

await test('set precision: clear on empty is a no-op for memos', expect => {
	const s = mutable(new Set())
	let sizeCalls = 0
	let hasCalls = 0
	const ms = memo(() => {
		sizeCalls++
		return s.size
	})
	const mh = memo(() => {
		hasCalls++
		return s.has('x')
	})
	expect(ms()).toBe(0)
	expect(mh()).toBe(false)
	expect(sizeCalls).toBe(1)
	expect(hasCalls).toBe(1)

	s.clear()
	expect(ms()).toBe(0)
	expect(mh()).toBe(false)
	expect(sizeCalls).toBe(1)
	expect(hasCalls).toBe(1)
})

await test('set precision: clear wakes every currently-subscribed has memo', expect => {
	const s = mutable(new Set(['a', 'b', 'c']))
	let aCalls = 0
	let bCalls = 0
	let cCalls = 0
	let zCalls = 0

	const mA = memo(() => {
		aCalls++
		return s.has('a')
	})
	const mB = memo(() => {
		bCalls++
		return s.has('b')
	})
	const mC = memo(() => {
		cCalls++
		return s.has('c')
	})
	// z is never in the set — should NOT wake on clear.
	const mZ = memo(() => {
		zCalls++
		return s.has('z')
	})
	mA()
	mB()
	mC()
	mZ()
	expect(aCalls).toBe(1)
	expect(bCalls).toBe(1)
	expect(cCalls).toBe(1)
	expect(zCalls).toBe(1)

	s.clear()
	mA()
	mB()
	mC()
	mZ()

	// Each value that WAS in the set sees its membership flip to false.
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(2)
	expect(cCalls).toBe(2)
	expect(mA()).toBe(false)
	expect(mB()).toBe(false)
	expect(mC()).toBe(false)

	// 'z' was never in the set — stays stable, no re-run.
	expect(zCalls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  Z. Ported from tests/mutable.test.set.js (upstream style)          */
/* ------------------------------------------------------------------ */

await test('upstream: instanceof', expect => {
	const original = new Set()
	const observed = mutable(original)
	expect(original instanceof Set).toBe(true)
	expect(observed instanceof Set).toBe(true)
})

await test('upstream: should observe mutations', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => (dummy = set.has('value')))

	expect(dummy).toBe(false)
	set.add('value')
	expect(dummy).toBe(true)
	set.delete('value')
	expect(dummy).toBe(false)
})

await test('upstream: should observe mutations with observed value', expect => {
	let dummy
	const value = mutable({})
	const set = mutable(new Set())
	effect(() => (dummy = set.has(value)))

	expect(dummy).toBe(false)
	set.add(value)
	expect(dummy).toBe(true)
	set.delete(value)
	expect(dummy).toBe(false)
})

await test('upstream: should observe for of iteration', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => {
		dummy = 0
		for (let num of set) {
			dummy += num
		}
	})

	expect(dummy).toBe(0)
	set.add(2)
	set.add(1)
	expect(dummy).toBe(3)
	set.delete(2)
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should observe forEach iteration', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => {
		dummy = 0
		set.forEach(num => (dummy += num))
	})

	expect(dummy).toBe(0)
	set.add(2)
	set.add(1)
	expect(dummy).toBe(3)
	set.delete(2)
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should observe values iteration', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => {
		dummy = 0
		for (let num of set.values()) {
			dummy += num
		}
	})

	expect(dummy).toBe(0)
	set.add(2)
	set.add(1)
	expect(dummy).toBe(3)
	set.delete(2)
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should observe keys iteration', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => {
		dummy = 0
		for (let num of set.keys()) {
			dummy += num
		}
	})

	expect(dummy).toBe(0)
	set.add(2)
	set.add(1)
	expect(dummy).toBe(3)
	set.delete(2)
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should observe entries iteration', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => {
		dummy = 0
		for (let [key, num] of set.entries()) {
			key
			dummy += num
		}
	})

	expect(dummy).toBe(0)
	set.add(2)
	set.add(1)
	expect(dummy).toBe(3)
	set.delete(2)
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should be triggered by clearing', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => (dummy = set.has('key')))

	expect(dummy).toBe(false)
	set.add('key')
	expect(dummy).toBe(true)
	set.clear()
	expect(dummy).toBe(false)
})

await test('upstream-adapted: DOES observe custom property mutations (pota divergence)', expect => {
	// Upstream Solid treats Set as collection-only: custom property
	// writes bypass tracking. Pota's ProxyHandlerSet extends
	// ProxyHandlerObject, so custom props are reactive like any other
	// property. Kept as documented divergence — adding custom props
	// to a Set is an anti-pattern, but if anyone does it, reactivity
	// is the lesser surprise.
	let dummy
	const set = mutable(new Set())
	effect(() => (dummy = set.customProp))

	expect(dummy).toBe(undefined)
	set.customProp = 'Hello World'
	expect(dummy).toBe('Hello World')
})

await test('upstream: should observe size mutations', expect => {
	let dummy
	const set = mutable(new Set())
	effect(() => (dummy = set.size))

	expect(dummy).toBe(0)
	set.add('value')
	set.add('value2')
	expect(dummy).toBe(2)
	set.delete('value')
	expect(dummy).toBe(1)
	set.clear()
	expect(dummy).toBe(0)
})

await test('upstream: should not observe non value changing mutations', expect => {
	let dummy
	const set = mutable(new Set())
	let calls = 0
	effect(() => {
		calls++
		dummy = set.has('value')
	})

	expect(dummy).toBe(false)
	expect(calls).toBe(1)
	set.add('value')
	expect(dummy).toBe(true)
	expect(calls).toBe(2)
	set.add('value')
	expect(dummy).toBe(true)
	expect(calls).toBe(2)
	set.delete('value')
	expect(dummy).toBe(false)
	expect(calls).toBe(3)
	set.delete('value')
	expect(dummy).toBe(false)
	expect(calls).toBe(3)
	set.clear()
	expect(dummy).toBe(false)
	expect(calls).toBe(3)
})

await test('upstream: should support objects as key', expect => {
	let dummy
	const key = {}
	const set = mutable(new Set())
	let calls = 0
	effect(() => {
		calls++
		dummy = set.has(key)
	})

	expect(dummy).toBe(false)
	expect(calls).toBe(1)

	set.add({})
	expect(dummy).toBe(false)
	expect(calls).toBe(1)

	set.add(key)
	expect(dummy).toBe(true)
	expect(calls).toBe(2)
})

await test('upstream-adapted: raw set DOES receive proxies (pota mutates in place)', expect => {
	// Pota's design: `mutable(x)` wraps x in a proxy and writes
	// through to x — the raw object IS the store. If the user wants
	// the original to stay pristine, they pass `clone: true`:
	// `mutable(x, true)` copies x before wrapping.
	const set = new Set()
	const observed = mutable(set)
	const value = mutable({})
	observed.add(value)
	expect(observed.has(value)).toBe(true)
	expect(set.has(value)).toBe(true)
})

await test('pota: mutable(set, true) keeps the original set pristine', expect => {
	const set = new Set()
	const observed = mutable(set, true)
	const value = mutable({})
	observed.add(value)
	expect(observed.has(value)).toBe(true)
	expect(set.has(value)).toBe(false)
	expect(set.size).toBe(0)
})

await test('upstream: should observe nested values in iterations (forEach)', expect => {
	const set = mutable(new Set([{ foo: 1 }]))
	let dummy
	effect(() => {
		dummy = 0
		set.forEach(value => {
			dummy += value.foo
		})
	})
	expect(dummy).toBe(1)
	set.forEach(value => {
		value.foo++
	})
	expect(dummy).toBe(2)
})

await test('upstream: should observe nested values in iterations (values)', expect => {
	const set = mutable(new Set([{ foo: 1 }]))
	let dummy
	effect(() => {
		dummy = 0
		for (const value of set.values()) {
			dummy += value.foo
		}
	})
	expect(dummy).toBe(1)
	set.forEach(value => {
		value.foo++
	})
	expect(dummy).toBe(2)
})

await test('upstream: should observe nested values in iterations (entries)', expect => {
	const set = mutable(new Set([{ foo: 1 }]))
	let dummy
	effect(() => {
		dummy = 0
		for (const [key, value] of set.entries()) {
			dummy += value.foo
		}
	})
	expect(dummy).toBe(1)
	set.forEach(value => {
		value.foo++
	})
	expect(dummy).toBe(2)
})

await test('upstream: should observe nested values in iterations (for...of)', expect => {
	const set = mutable(new Set([{ foo: 1 }]))
	let dummy
	effect(() => {
		dummy = 0
		for (const value of set) {
			dummy += value.foo
		}
	})
	expect(dummy).toBe(1)
	set.forEach(value => {
		value.foo++
	})
	expect(dummy).toBe(2)
})

await test('upstream: should work with reactive entries in raw set', expect => {
	const raw = new Set()
	const entry = mutable({})
	raw.add(entry)
	const set = mutable(raw)

	expect(set.has(entry)).toBe(true)

	expect(set.delete(entry)).toBe(true)
	expect(set.has(entry)).toBe(false)
})

await test('upstream: should track deletion of reactive entries in raw set', expect => {
	const raw = new Set()
	const entry = mutable({})
	raw.add(entry)
	const set = mutable(raw)

	let dummy
	effect(() => {
		dummy = set.has(entry)
	})
	expect(dummy).toBe(true)

	set.delete(entry)
	expect(dummy).toBe(false)
})

await test('upstream-adapted: forEach respects thisArg (standard binding; `that` → `this`)', expect => {
	// Upstream test used `function (that, value, _, set)` treating `that`
	// as a positional alias for `this` — which isn't how JS works. Fixed
	// here to the actual intent: thisArg binds `this` inside the
	// callback, standard Set.forEach semantics.
	const raw = new Set(['value'])
	const proxy = mutable(raw)
	const thisArg = {}
	let count = 0
	proxy.forEach(
		/** @this {object} */
		function (value, _, set) {
			++count
			expect(this).toBe(thisArg)
			expect(value).toBe('value')
			expect(set).toBe(proxy)
		},
		thisArg,
	)
	expect(count).toBe(1)
})

await test('upstream: should return proxy from Set.add call', expect => {
	const set = mutable(new Set())
	const result = set.add('a')
	expect(result).toBe(set)
})

await test('upstream: observing subtypes of IterableCollections(Map, Set) [solid]', expect => {
	// subtypes of Set
	class CustomSet extends Set {}
	const cset = mutable(new CustomSet())

	expect(cset instanceof Set).toBe(true)

	let dummy
	effect(() => (dummy = cset.has('value')))
	expect(dummy).toBe(false)
	cset.add('value')
	expect(dummy).toBe(true)
	cset.delete('value')
	expect(dummy).toBe(false)
})

await test('upstream: observing subtypes of IterableCollections(Map, Set) deep [solid]', expect => {
	// subtypes of Set
	class CustomSet extends Set {}
	const cset = mutable({ value: new CustomSet() })

	expect(cset.value instanceof Set).toBe(true)

	let dummy
	effect(() => (dummy = cset.value.has('value')))
	expect(dummy).toBe(false)
	cset.value.add('value')
	expect(dummy).toBe(true)
	cset.value.delete('value')
	expect(dummy).toBe(false)
})
