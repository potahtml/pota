/** @jsxImportSource pota */

/**
 * Array-specific coverage for the mutable store.
 *
 * Arrays are tracked differently than plain objects: `ProxyHandlerArray`
 * fires `valueRead`/`valueWrite` on every key via its own `get`/`set`
 * traps, so per-key tracking is proxy-centric rather than
 * accessor-centric. These tests pin down the behavior of
 * `Object.defineProperty` on arrays now that the array trap skips the
 * `signalifyKey` wrapping step (which would otherwise double-track
 * numeric indices).
 */

import { test as _test } from '#test'

import { syncEffect as effect, memo } from 'pota'
import { mutable } from 'pota/store'

const test = _test

/* ------------------------------------------------------------------ */
/*  A. Object.defineProperty on array indices                          */
/* ------------------------------------------------------------------ */

await test('array defineProperty: data descriptor on new index updates value', expect => {
	const arr = mutable([1, 2])
	Object.defineProperty(arr, 2, {
		value: 3,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(arr[2]).toBe(3)
	expect(arr.length).toBe(3)
})

await test('array defineProperty: data descriptor invalidates memo reading the index', expect => {
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[1]
	})
	expect(m()).toBe(2)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 1, {
		value: 20,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(m()).toBe(20)
	expect(calls).toBe(2)
})

await test('array defineProperty: same-value redefine is a no-op for Value subscribers', expect => {
	const arr = mutable([10, 20, 30])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[0]
	})
	expect(m()).toBe(10)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 0, {
		value: 10,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(m()).toBe(10)
	expect(calls).toBe(1)
})

await test('array defineProperty: reading an index registers exactly one subscription', expect => {
	// Regression for the "double-subscription" churn that signalifyKey
	// would have introduced on arrays. We can't inspect the tracker's
	// internal subscriber list directly, but the re-run count is a
	// faithful proxy — a single write should produce a single re-run.
	const arr = mutable([1, 2])
	Object.defineProperty(arr, 0, {
		value: 100,
		writable: true,
		enumerable: true,
		configurable: true,
	})

	let calls = 0
	const m = memo(() => {
		calls++
		return arr[0]
	})
	expect(m()).toBe(100)
	expect(calls).toBe(1)

	arr[0] = 200
	expect(m()).toBe(200)
	expect(calls).toBe(2)

	arr[0] = 300
	expect(m()).toBe(300)
	expect(calls).toBe(3)
})

await test('array defineProperty: non-enumerable new index does not invalidate Object.keys subscribers', expect => {
	const arr = mutable([1, 2])
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(arr).join(',')
	})
	expect(m()).toBe('0,1')
	expect(calls).toBe(1)

	// Adding a non-enumerable property; Object.keys result is unchanged.
	Object.defineProperty(arr, 'meta', {
		value: 'hidden',
		writable: true,
		enumerable: false,
		configurable: true,
	})
	expect(m()).toBe('0,1')
	expect(calls).toBe(1)
})

await test('array defineProperty: enumerable new string key invalidates Object.keys subscribers', expect => {
	const arr = mutable([1, 2])
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(arr).join(',')
	})
	expect(m()).toBe('0,1')
	expect(calls).toBe(1)

	Object.defineProperty(arr, 'tag', {
		value: 'x',
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(calls).toBe(2)
	expect(m()).toBe('0,1,tag')
})

await test('array defineProperty: enumerability transition on an existing index invalidates Object.keys', expect => {
	const arr = mutable([1, 2])
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(arr).join(',')
	})
	expect(m()).toBe('0,1')
	expect(calls).toBe(1)

	// Flip index 0 to non-enumerable — it should disappear from Object.keys.
	Object.defineProperty(arr, 0, {
		value: 1,
		writable: true,
		enumerable: false,
		configurable: true,
	})
	expect(calls).toBe(2)
	expect(m()).toBe('1')
})

await test('array defineProperty: accessor descriptor on a new key — read returns getter result', expect => {
	const arr = mutable([1, 2, 3])
	let reads = 0
	Object.defineProperty(arr, 'sum', {
		get() {
			reads++
			return this[0] + this[1] + this[2]
		},
		enumerable: false,
		configurable: true,
	})
	expect(arr.sum).toBe(6)
	expect(reads).toBe(1)
})

await test('array defineProperty: `has` / `in` sees the newly defined key', expect => {
	const arr = mutable([1, 2])
	expect(5 in arr).toBe(false)
	Object.defineProperty(arr, 5, {
		value: 99,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(5 in arr).toBe(true)
	expect(arr[5]).toBe(99)
})

await test('array defineProperty: in a batch-like sequence produces one re-run per read key', expect => {
	const arr = mutable([1, 2, 3])
	let aCalls = 0
	let bCalls = 0
	const mA = memo(() => {
		aCalls++
		return arr[0]
	})
	const mB = memo(() => {
		bCalls++
		return arr[1]
	})
	expect(mA()).toBe(1)
	expect(mB()).toBe(2)
	expect(aCalls).toBe(1)
	expect(bCalls).toBe(1)

	Object.defineProperty(arr, 0, {
		value: 10,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(mA()).toBe(10)
	expect(mB()).toBe(2)
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(1)

	Object.defineProperty(arr, 1, {
		value: 20,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(mA()).toBe(10)
	expect(mB()).toBe(20)
	expect(aCalls).toBe(2)
	expect(bCalls).toBe(2)
})

await test('array defineProperty: on `length` shortens the array and invalidates index readers', expect => {
	const arr = mutable([1, 2, 3, 4])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr.length
	})
	expect(m()).toBe(4)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 'length', {
		value: 2,
		writable: true,
		enumerable: false,
		configurable: false,
	})
	expect(arr.length).toBe(2)
	expect(m()).toBe(2)
	expect(calls).toBe(2)
	expect(arr[2]).toBe(undefined)
	expect(arr[3]).toBe(undefined)
})

/* ------------------------------------------------------------------ */
/*  B. Fine-grained tracking — no over-notify                          */
/* ------------------------------------------------------------------ */

await test('array precision: arr[0] write does not re-fire arr[1] memo', expect => {
	const arr = mutable([10, 20, 30])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[1]
	})
	expect(m()).toBe(20)
	expect(calls).toBe(1)

	arr[0] = 100
	expect(m()).toBe(20)
	expect(calls).toBe(1)

	arr[2] = 300
	expect(m()).toBe(20)
	expect(calls).toBe(1)
})

await test('array precision: arr[0] same-value write is a no-op', expect => {
	const arr = mutable([10, 20])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[0]
	})
	expect(m()).toBe(10)
	expect(calls).toBe(1)

	arr[0] = 10
	expect(m()).toBe(10)
	expect(calls).toBe(1)
})

await test('array precision: length memo does not re-fire on same-length assignments', expect => {
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr.length
	})
	expect(m()).toBe(3)
	expect(calls).toBe(1)

	arr[0] = 100 // length unchanged
	expect(m()).toBe(3)
	expect(calls).toBe(1)

	arr[1] = 200
	expect(m()).toBe(3)
	expect(calls).toBe(1)
})

await test('array precision: pushing wakes length memo but not sibling-index memo', expect => {
	const arr = mutable([10, 20])
	let lenCalls = 0
	let idxCalls = 0
	const mLen = memo(() => {
		lenCalls++
		return arr.length
	})
	const mIdx = memo(() => {
		idxCalls++
		return arr[0]
	})
	expect(mLen()).toBe(2)
	expect(mIdx()).toBe(10)
	expect(lenCalls).toBe(1)
	expect(idxCalls).toBe(1)

	arr.push(30)
	expect(mLen()).toBe(3)
	expect(mIdx()).toBe(10)
	expect(lenCalls).toBe(2)
	expect(idxCalls).toBe(1)
})

await test('array precision: delete arr[i] does not wake unrelated index memos', expect => {
	const arr = mutable([10, 20, 30])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[0]
	})
	expect(m()).toBe(10)
	expect(calls).toBe(1)

	delete arr[2]
	expect(m()).toBe(10)
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  C. thisArg binding on callback methods                             */
/* ------------------------------------------------------------------ */

await test('array: forEach respects thisArg', expect => {
	const arr = mutable([1, 2, 3])
	const thisArg = { tag: 'x' }
	const seen = []
	arr.forEach(
		/** @this {object} */
		function (value, index) {
			seen.push({ t: this, value, index })
		},
		thisArg,
	)
	expect(seen.length).toBe(3)
	for (const s of seen) {
		expect(s.t).toBe(thisArg)
	}
})

await test('array: map respects thisArg', expect => {
	const arr = mutable([1, 2, 3])
	const thisArg = { mul: 10 }
	const out = arr.map(
		/** @this {{mul: number}} */
		function (v) {
			return v * this.mul
		},
		thisArg,
	)
	expect(out).toEqual([10, 20, 30])
})

await test('array: filter/find/some/every respect thisArg', expect => {
	const arr = mutable([1, 2, 3, 4])
	const thisArg = { threshold: 2 }

	const filtered = arr.filter(
		/** @this {{threshold: number}} */
		function (v) {
			return v > this.threshold
		},
		thisArg,
	)
	expect(filtered).toEqual([3, 4])

	const found = arr.find(
		/** @this {{threshold: number}} */
		function (v) {
			return v > this.threshold
		},
		thisArg,
	)
	expect(found).toBe(3)

	expect(
		arr.some(
			/** @this {{threshold: number}} */
			function (v) {
				return v > this.threshold
			},
			thisArg,
		),
	).toBe(true)

	expect(
		arr.every(
			/** @this {{threshold: number}} */
			function (v) {
				return v > this.threshold
			},
			thisArg,
		),
	).toBe(false)
})

/* ------------------------------------------------------------------ */
/*  D. Callback's 3rd `array` arg — should be the proxy (not raw)      */
/*                                                                     */
/*  These tests motivate why Array should match Map/Set and pass the   */
/*  proxy as the 3rd positional arg: writes/reads through that arg     */
/*  should hit the reactive path.                                      */
/* ------------------------------------------------------------------ */

await test('array: forEach callback `array` arg is the proxy (identity)', expect => {
	const arr = mutable([1, 2, 3])
	let seen
	arr.forEach((_v, _i, array) => {
		seen = array
	})
	expect(seen).toBe(arr)
})

await test('array: writing through the callback `array` arg fires reactivity', expect => {
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[0]
	})
	m()
	expect(calls).toBe(1)
	expect(m()).toBe(1)

	arr.forEach((_v, i, array) => {
		if (i === 0) array[i] = 100
	})

	m()
	expect(m()).toBe(100)
	expect(calls).toBe(2)
})

await test('array: map callback `array` arg is the proxy', expect => {
	const arr = mutable([1, 2])
	const refs = arr.map((_v, _i, array) => array)
	expect(refs[0]).toBe(arr)
	expect(refs[1]).toBe(arr)
})

await test('array: filter callback `array` arg is the proxy', expect => {
	const arr = mutable([1, 2, 3])
	let seen
	arr.filter((_v, _i, array) => {
		seen = array
		return true
	})
	expect(seen).toBe(arr)
})

await test('array: find callback `array` arg is the proxy', expect => {
	const arr = mutable([1, 2, 3])
	let seen
	arr.find((_v, _i, array) => {
		seen = array
		return false
	})
	expect(seen).toBe(arr)
})

await test('array: some/every callback `array` arg is the proxy', expect => {
	const arr = mutable([1, 2, 3])
	let seenSome, seenEvery
	arr.some((_v, _i, array) => {
		seenSome = array
		return false
	})
	arr.every((_v, _i, array) => {
		seenEvery = array
		return true
	})
	expect(seenSome).toBe(arr)
	expect(seenEvery).toBe(arr)
})

await test('array: reduce callback `array` arg is the proxy', expect => {
	const arr = mutable([1, 2, 3])
	let seen
	arr.reduce((acc, _v, _i, array) => {
		seen = array
		return acc
	}, 0)
	expect(seen).toBe(arr)
})
