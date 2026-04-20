/** @jsxImportSource pota */

/**
 * Tracking-hygiene tests for the mutable store.
 *
 * Goal: verify that pota's internal operations (mutable setup,
 * signalify, copy, reconcile, proxy trap bookkeeping) do NOT leak
 * reactive subscriptions into whatever reactive context happens to be
 * running when the operation is invoked.
 *
 * Pattern: every test runs an operation inside a memo and asserts the
 * memo wasn't subscribed to anything it shouldn't be. The memo should
 * not re-run when an unrelated piece of state changes.
 */

import { test as _test } from '#test'

import { syncEffect as effect, memo, untrack } from 'pota'
import {
	copy,
	merge,
	mutable,
	replace,
	reset,
	signalify,
} from 'pota/store'

const test = _test

/* ------------------------------------------------------------------ */
/*  A. Initial assumptions — mutable() setup does not leak            */
/* ------------------------------------------------------------------ */

await test('tracking: mutable() on plain object inside a memo does not leak subscriptions', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		// Create a new mutable inside the memo. signalifyObject should
		// be wrapped in `untrack()` — no subscriptions should leak.
		const fresh = mutable({ a: 1, b: 2 })
		return fresh
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable() on array inside a memo does not leak subscriptions', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable([1, 2, 3])
		return fresh
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable() on Map inside a memo does not leak subscriptions', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable(
			new Map([
				['a', 1],
				['b', 2],
			]),
		)
		return fresh
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable() on Set inside a memo does not leak subscriptions', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable(new Set([1, 2, 3]))
		return fresh
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable() on nested object does not subscribe to child properties', expect => {
	const child = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		// Wrapping an object whose value is already a mutable should not
		// read the mutable's properties (mutable.js wraps `forEach` /
		// initial-content loops in `untrack`).
		const fresh = mutable({ holder: child })
		return fresh
	})
	m()
	expect(calls).toBe(1)

	child.a = 99 // unrelated to memo
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable() with clone=true inside a memo does not leak subscriptions', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		// copy() invokes user getters via untrack; no leak expected.
		const fresh = mutable({ a: 1, b: { c: 2 } }, true)
		return fresh
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  B. signalify() inside a memo                                      */
/* ------------------------------------------------------------------ */

await test('tracking: signalify() on plain object inside a memo does not leak', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const plain = { a: 1 }
		signalify(plain)
		return plain
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: signalify() with keys list does not leak', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const plain = { a: 1, b: 2 }
		signalify(plain, ['a'])
		return plain
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  C. copy() inside a memo                                           */
/* ------------------------------------------------------------------ */

await test('tracking: copy() of plain object inside a memo does not leak', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const c = copy({ a: 1, nested: { b: 2 } })
		return c
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: copy() of mutable inside a memo does not subscribe to its properties', expect => {
	const source = mutable({ a: 1, b: 2, c: 3 })
	let calls = 0
	const m = memo(() => {
		calls++
		// copy() reads each property of the mutable through its accessor
		// wrappers. Without untrack around accessor invocation, the
		// calling memo would subscribe to every key.
		return copy(source)
	})
	m()
	expect(calls).toBe(1)

	source.a = 10
	m()
	expect(calls).toBe(1)

	source.b = 20
	m()
	expect(calls).toBe(1)
})

await test('tracking: copy() of object with accessor does not subscribe caller to getter deps', expect => {
	const external = mutable({ n: 1 })
	const source = {
		get derived() {
			return external.n + 100
		},
	}
	let calls = 0
	const m = memo(() => {
		calls++
		return copy(source)
	})
	m()
	expect(calls).toBe(1)

	// external.n change should NOT wake m — copy invokes the getter
	// under untrack so the getter's deps don't leak.
	external.n = 2
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  D. Reconcile functions inside a memo                              */
/* ------------------------------------------------------------------ */

await test('tracking: merge() does not leak subscriptions to sources', expect => {
	const srcA = mutable({ x: 1 })
	const srcB = { b: 2 }
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		merge(target, srcB)
		return target
	})
	m()
	expect(calls).toBe(1)

	srcA.x = 99
	m()
	expect(calls).toBe(1)
})

await test('tracking: replace() does not leak subscriptions to sources', expect => {
	const srcA = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		replace(target, { a: 2, b: 3 })
		return target
	})
	m()
	expect(calls).toBe(1)

	srcA.x = 99
	m()
	expect(calls).toBe(1)
})

await test('tracking: reset() does not leak subscriptions to sources', expect => {
	const srcA = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		reset(target, { a: 2 })
		return target
	})
	m()
	expect(calls).toBe(1)

	srcA.x = 99
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  E. Identity key reads — $isMutable / constructor / __proto__      */
/* ------------------------------------------------------------------ */

await test('tracking: accessing constructor does not subscribe', expect => {
	const obj = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return obj.constructor
	})
	m()
	expect(calls).toBe(1)

	obj.a = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: accessing __proto__ does not subscribe', expect => {
	const obj = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return obj.__proto__
	})
	m()
	expect(calls).toBe(1)

	obj.a = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: accessing Symbol.toStringTag does not subscribe', expect => {
	const obj = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return /** @type {Record<symbol, any>} */ (obj)[
			Symbol.toStringTag
		]
	})
	m()
	expect(calls).toBe(1)

	obj.a = 2
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  F. Method reads vs method calls                                   */
/* ------------------------------------------------------------------ */

await test('tracking: reading a method without calling it does not subscribe', expect => {
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		// Just reading forEach (not calling) shouldn't subscribe
		// because the get trap returns `returnFunction(...)` without
		// firing track.valueRead for functions.
		return arr.forEach
	})
	m()
	expect(calls).toBe(1)

	arr[0] = 100
	m()
	expect(calls).toBe(1)
})

await test('tracking: reading Map.get method without calling does not subscribe', expect => {
	const m1 = mutable(new Map([['a', 1]]))
	let calls = 0
	const m = memo(() => {
		calls++
		return m1.get
	})
	m()
	expect(calls).toBe(1)

	m1.set('a', 99)
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  G. Proxy setup does not leak across root() boundaries             */
/* ------------------------------------------------------------------ */

await test('tracking: re-wrapping via defineProperty inside a memo does not leak', expect => {
	const inner = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const local = mutable({ a: 1 })
		Object.defineProperty(local, 'b', {
			value: 2,
			writable: true,
			enumerable: true,
			configurable: true,
		})
		return local
	})
	m()
	expect(calls).toBe(1)

	inner.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: pre-wrapping Set initial content does not leak', expect => {
	// Set pre-wraps contents via clear+re-add inside untrack.
	// If that slipped, a memo creating mutable(new Set([obj])) would
	// subscribe to obj's proxy machinery.
	const outerControl = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable(new Set([{ a: 1 }, { b: 2 }]))
		return fresh
	})
	m()
	expect(calls).toBe(1)

	outerControl.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: pre-wrapping Map initial content does not leak', expect => {
	const outerControl = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable(new Map([['k', { v: 1 }]]))
		return fresh
	})
	m()
	expect(calls).toBe(1)

	outerControl.x = 2
	m()
	expect(calls).toBe(1)
})

await test('tracking: pre-wrapping Array initial content does not leak', expect => {
	const outerControl = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const fresh = mutable([{ a: 1 }, { b: 2 }])
		return fresh
	})
	m()
	expect(calls).toBe(1)

	outerControl.x = 2
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  H. copy() policy — direct use is caller-untracks                   */
/* ------------------------------------------------------------------ */

/**
 * Policy: `copy()` called directly on a mutable inside a memo WILL
 * subscribe — `Reflect.ownKeys(mutable)` hits the `ownKeys` trap,
 * `getOwnPropertyDescriptor` hits the `has` trap, and Set/Map copy
 * iterates via `Symbol.iterator` which subscribes through the
 * trackSlot. The getter invocation is wrapped in `untrack` (so
 * accessor bodies don't leak), but structural enumeration isn't.
 *
 * Callers who want a subscription-free snapshot must wrap
 * `copy(source)` in `untrack(() => ...)` themselves. These tests
 * pin both halves of that contract.
 */

await test('copy policy: copy(plain) does not subscribe', expect => {
	const unrelated = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return copy({ a: 1, nested: { b: 2 } })
	})
	m()
	expect(calls).toBe(1)

	unrelated.x = 2
	m()
	expect(calls).toBe(1)
})

await test('copy policy: copy(mutable object) subscribes to key-set changes', expect => {
	const source = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return copy(source)
	})
	m()
	expect(calls).toBe(1)

	// Value-only write doesn't touch key-set — no re-run.
	source.a = 10
	m()
	expect(calls).toBe(1)

	// Adding a new key fires keysWrite → memo subscribed via ownKeys
	// trap re-runs. Caller must untrack if this is unwanted.
	source.b = 2
	m()
	expect(calls).toBe(2)
})

await test('copy policy: wrapping copy(mutable object) in untrack suppresses the subscription', expect => {
	const source = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return untrack(() => copy(source))
	})
	m()
	expect(calls).toBe(1)

	source.b = 2
	m()
	expect(calls).toBe(1)

	delete source.a
	m()
	expect(calls).toBe(1)
})

await test('copy policy: copy(mutable array) subscribes; untrack suppresses', expect => {
	const source = mutable([1, 2, 3])

	// Leaky form
	let leakyCalls = 0
	const leaky = memo(() => {
		leakyCalls++
		return copy(source)
	})
	leaky()
	source.push(4)
	leaky()
	expect(leakyCalls).toBe(2)

	// Safe form
	const source2 = mutable([1, 2, 3])
	let safeCalls = 0
	const safe = memo(() => {
		safeCalls++
		return untrack(() => copy(source2))
	})
	safe()
	source2.push(4)
	safe()
	expect(safeCalls).toBe(1)
})

await test('copy policy: copy(mutable Map) subscribes; untrack suppresses', expect => {
	const source = mutable(new Map([['a', 1]]))

	let leakyCalls = 0
	const leaky = memo(() => {
		leakyCalls++
		return copy(source)
	})
	leaky()
	source.set('b', 2)
	leaky()
	expect(leakyCalls).toBe(2)

	const source2 = mutable(new Map([['a', 1]]))
	let safeCalls = 0
	const safe = memo(() => {
		safeCalls++
		return untrack(() => copy(source2))
	})
	safe()
	source2.set('b', 2)
	safe()
	expect(safeCalls).toBe(1)
})

await test('copy policy: copy(mutable Set) subscribes; untrack suppresses', expect => {
	const source = mutable(new Set([1, 2]))

	let leakyCalls = 0
	const leaky = memo(() => {
		leakyCalls++
		return copy(source)
	})
	leaky()
	source.add(3)
	leaky()
	expect(leakyCalls).toBe(2)

	const source2 = mutable(new Set([1, 2]))
	let safeCalls = 0
	const safe = memo(() => {
		safeCalls++
		return untrack(() => copy(source2))
	})
	safe()
	source2.add(3)
	safe()
	expect(safeCalls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  K. Internal copy() — mutable(x, clone=true) must NOT leak          */
/* ------------------------------------------------------------------ */

/**
 * `mutable(value, true)` calls `copy(value)` internally before
 * wrapping. When `value` is itself a mutable, the internal copy
 * traversal would subscribe the caller to the source's signals
 * unless wrapped in `untrack`. That `untrack` belongs to us (the
 * library), not the caller — the caller asked for a cloned
 * mutable, not for reactivity on the source.
 */

await test('tracking: mutable(mutable object, clone=true) does not leak', expect => {
	const source = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return mutable(source, true)
	})
	m()
	expect(calls).toBe(1)

	source.b = 99
	m()
	expect(calls).toBe(1)

	delete source.a
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable(mutable array, clone=true) does not leak', expect => {
	const source = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		return mutable(source, true)
	})
	m()
	expect(calls).toBe(1)

	source.push(4)
	m()
	expect(calls).toBe(1)

	source[0] = 99
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable(mutable Map, clone=true) does not leak', expect => {
	const source = mutable(new Map([['a', 1]]))
	let calls = 0
	const m = memo(() => {
		calls++
		return mutable(source, true)
	})
	m()
	expect(calls).toBe(1)

	source.set('b', 2)
	m()
	expect(calls).toBe(1)

	source.delete('a')
	m()
	expect(calls).toBe(1)
})

await test('tracking: mutable(mutable Set, clone=true) does not leak', expect => {
	const source = mutable(new Set([1, 2]))
	let calls = 0
	const m = memo(() => {
		calls++
		return mutable(source, true)
	})
	m()
	expect(calls).toBe(1)

	source.add(3)
	m()
	expect(calls).toBe(1)

	source.delete(1)
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  L. Internal paths we already wrap in untrack                       */
/* ------------------------------------------------------------------ */

/**
 * Deliberately duplicates assurances from sections A–G, but targets
 * places where the caller passes a MUTABLE as input — the most
 * likely setting for a missed untrack. Each test exercises an
 * internal traversal over a mutable source and asserts no leak.
 */

await test('tracking: merge(target, mutable source) does not leak to source', expect => {
	const source = mutable({ x: 1, nested: { y: 2 } })
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		merge(target, source)
		return target
	})
	m()
	expect(calls).toBe(1)

	source.z = 99
	m()
	expect(calls).toBe(1)

	source.nested.y = 999
	m()
	expect(calls).toBe(1)
})

await test('tracking: replace(target, mutable source) does not leak to source', expect => {
	const source = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		replace(target, source)
		return target
	})
	m()
	expect(calls).toBe(1)

	source.x = 999
	m()
	expect(calls).toBe(1)

	source.y = 5
	m()
	expect(calls).toBe(1)
})

await test('tracking: reset(target, mutable source) does not leak to source', expect => {
	const source = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		const target = mutable({ a: 1 })
		reset(target, source)
		return target
	})
	m()
	expect(calls).toBe(1)

	source.x = 999
	m()
	expect(calls).toBe(1)
})

await test('tracking: signalify on already-mutable short-circuits without leak', expect => {
	const source = mutable({ a: 1, b: 2 })
	let calls = 0
	const m = memo(() => {
		calls++
		// signalify(target) checks `target[$isMutable]` and bails out.
		// The `$isMutable` read short-circuits in the get trap before
		// any track.*Read, so no subscription leaks.
		signalify(source)
		return source
	})
	m()
	expect(calls).toBe(1)

	source.a = 99
	m()
	expect(calls).toBe(1)

	source.c = 3
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  M. Writes on an existing mutable must not subscribe                */
/* ------------------------------------------------------------------ */

/**
 * Every WRITE operation on a mutable — `set`, `delete`,
 * `defineProperty`, Array/Map/Set write methods — should fire
 * track.*Write internally but never a track.*Read. A memo whose
 * body only writes should subscribe to nothing, so an unrelated
 * mutable changing elsewhere must not wake it.
 *
 * Pattern: memo body performs WRITE on `target`, then we mutate an
 * unrelated `sentinel`. If the write path accidentally read a
 * tracked signal, the sentinel change would wake the memo.
 */

/* ----- Plain object writes ----- */

await test('writes: set existing key does not subscribe', expect => {
	const target = mutable({ a: 1 })
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target.a = 2
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: set new key does not subscribe', expect => {
	const target = mutable({ a: 1 })
	const sentinel = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		// Distinct new key per call so we keep exercising the
		// `!(key in target)` branch (signalifyUndefinedKey path).
		target['k' + counter++] = 99
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: delete key does not subscribe', expect => {
	const target = mutable({ a: 1, b: 2, c: 3, d: 4 })
	const sentinel = mutable({ x: 1 })
	const keysToRemove = ['a', 'b', 'c', 'd']
	let calls = 0
	const m = memo(() => {
		calls++
		const k = keysToRemove.shift()
		if (k) delete target[k]
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: defineProperty data descriptor does not subscribe', expect => {
	const target = mutable({ a: 1 })
	const sentinel = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		Object.defineProperty(target, 'k' + counter++, {
			value: 42,
			writable: true,
			enumerable: true,
			configurable: true,
		})
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: defineProperty accessor descriptor does not subscribe', expect => {
	const target = mutable({ a: 1 })
	const sentinel = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		Object.defineProperty(target, 'k' + counter++, {
			get() {
				return 7
			},
			configurable: true,
			enumerable: true,
		})
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

/* ----- Array writes ----- */

await test('writes: array index set does not subscribe', expect => {
	const target = mutable([1, 2, 3])
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target[0] = 99
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array out-of-bounds set does not subscribe', expect => {
	const target = mutable([1, 2, 3])
	const sentinel = mutable({ x: 1 })
	let counter = 10
	let calls = 0
	const m = memo(() => {
		calls++
		target[counter++] = 99
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array length truncation does not subscribe', expect => {
	const target = mutable([1, 2, 3, 4, 5])
	const sentinel = mutable({ x: 1 })
	let len = 5
	let calls = 0
	const m = memo(() => {
		calls++
		target.length = --len
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array push/pop/shift/unshift/splice do not subscribe', expect => {
	const target = mutable([1, 2, 3])
	const sentinel = mutable({ x: 1 })
	const ops = [
		() => target.push(4),
		() => target.pop(),
		() => target.unshift(0),
		() => target.shift(),
		() => target.splice(1, 1, 99, 100),
	]
	let calls = 0
	const m = memo(() => {
		calls++
		const op = ops.shift()
		if (op) op()
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array sort/reverse/fill/copyWithin do not subscribe', expect => {
	const target = mutable([3, 1, 4, 1, 5, 9, 2, 6])
	const sentinel = mutable({ x: 1 })
	const ops = [
		() => target.sort(),
		() => target.reverse(),
		() => target.fill(0, 2, 4),
		() => target.copyWithin(0, 3, 5),
	]
	let calls = 0
	const m = memo(() => {
		calls++
		const op = ops.shift()
		if (op) op()
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array delete index does not subscribe', expect => {
	const target = mutable([1, 2, 3])
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		delete target[0]
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: array defineProperty does not subscribe', expect => {
	const target = mutable([1, 2, 3])
	const sentinel = mutable({ x: 1 })
	let counter = 10
	let calls = 0
	const m = memo(() => {
		calls++
		Object.defineProperty(target, counter++, {
			value: 42,
			writable: true,
			enumerable: true,
			configurable: true,
		})
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

/* ----- Map writes ----- */

await test('writes: map.set existing key does not subscribe', expect => {
	const target = mutable(new Map([['a', 1]]))
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target.set('a', 99)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: map.set new key does not subscribe', expect => {
	const target = mutable(new Map())
	const sentinel = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		target.set('k' + counter++, 42)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: map.delete does not subscribe', expect => {
	const target = mutable(
		new Map([
			['a', 1],
			['b', 2],
			['c', 3],
		]),
	)
	const sentinel = mutable({ x: 1 })
	const keys = ['a', 'b', 'c']
	let calls = 0
	const m = memo(() => {
		calls++
		const k = keys.shift()
		if (k) target.delete(k)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: map.clear does not subscribe', expect => {
	const target = mutable(
		new Map([
			['a', 1],
			['b', 2],
		]),
	)
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target.clear()
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

/* ----- Set writes ----- */

await test('writes: set.add existing value does not subscribe', expect => {
	const target = mutable(new Set([1, 2]))
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target.add(1)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: set.add new value does not subscribe', expect => {
	const target = mutable(new Set())
	const sentinel = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		target.add(counter++)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: set.delete does not subscribe', expect => {
	const target = mutable(new Set([1, 2, 3]))
	const sentinel = mutable({ x: 1 })
	const vals = [1, 2, 3]
	let calls = 0
	const m = memo(() => {
		calls++
		const v = vals.shift()
		if (v !== undefined) target.delete(v)
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

await test('writes: set.clear does not subscribe', expect => {
	const target = mutable(new Set([1, 2]))
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		target.clear()
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)
})

/* ----- Mixed: write a mutable VALUE into a mutable ----- */

await test('writes: writing a mutable into another mutable does not subscribe to the written value', expect => {
	const target = mutable({ holder: null })
	const child = mutable({ a: 1 })
	const sentinel = mutable({ x: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		// Setter re-wraps via mutable(value); since `child` is already
		// a mutable, mutable() short-circuits via $isMutable without
		// subscribing.
		target.holder = child
	})
	m()
	expect(calls).toBe(1)

	sentinel.x = 2
	m()
	expect(calls).toBe(1)

	// Also: modifying the child itself should not wake m — m never
	// READ target.holder, it only wrote.
	child.a = 99
	m()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  I. getOwnPropertyDescriptor inside a memo                          */
/* ------------------------------------------------------------------ */

/**
 * The `getOwnPropertyDescriptor` trap calls `this.has(target, key)`
 * which subscribes to `track.keyRead(key)`. That's arguably
 * intentional — if you ask "does this key exist?" via descriptor
 * introspection you probably want reactivity. Document current
 * behavior: descriptor reads DO subscribe to key existence.
 */
await test('tracking: getOwnPropertyDescriptor currently subscribes to key existence', expect => {
	const source = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.getOwnPropertyDescriptor(source, 'a')
	})
	m()
	expect(calls).toBe(1)

	// Same-value write on `a` — does NOT change `has`, should NOT wake.
	source.a = 2
	m()
	expect(calls).toBe(1)

	// Adding a different key fires `keysWrite` (no keyRead subscription
	// for 'a') — descriptor read for 'a' doesn't call ownKeys, so this
	// should not wake m either.
	source.b = 99
	m()
	expect(calls).toBe(1)

	// Delete 'a' — `has` flips false → wakes m (by design).
	delete source.a
	m()
	expect(calls).toBe(2)
})

/* ------------------------------------------------------------------ */
/*  J. Reflect.ownKeys / Object.keys direct reads                       */
/* ------------------------------------------------------------------ */

/**
 * Direct `Object.keys(mutable)` IS expected to subscribe — the user
 * explicitly asked for the key set. But document the boundary: it
 * subscribes to `keysRead`, NOT to per-value changes.
 */
await test('tracking: Object.keys subscribes to key set, not values', expect => {
	const source = mutable({ a: 1, b: 2 })
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(source)
	})
	m()
	expect(calls).toBe(1)

	// Value change — should not wake.
	source.a = 10
	m()
	expect(calls).toBe(1)

	// Adding a new key — SHOULD wake.
	source.c = 3
	m()
	expect(calls).toBe(2)
})
