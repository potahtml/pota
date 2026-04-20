/** @jsxImportSource pota */

/**
 * Adversarial / boundary-condition tests for the mutable store.
 *
 * Each test asserts what SHOULD happen in a subtle edge case. Tests
 * that fail here are not necessarily bugs — the maintainer decides
 * whether to fix pota, adjust the assertion, or document.
 */

import { test as _test } from '#test'
import { isProxy } from 'pota/use/test'

import { syncEffect as effect, memo } from 'pota'
import { copy, mutable } from 'pota/store'

const test = _test

/* ------------------------------------------------------------------ */
/*  A. Tracker split edge cases                                        */
/* ------------------------------------------------------------------ */

await test('tracker split: map.set(42, …) and map.set("42", …) are distinct (native Map identity)', expect => {
	const m = mutable(new Map())
	m.set(42, 'number')
	m.set('42', 'string')

	expect(m.get(42)).toBe('number')
	expect(m.get('42')).toBe('string')
	expect(m.size).toBe(2)
})

await test('tracker split: reactive precision for number vs string keys in Map', expect => {
	// With our primitive-routed #props, both 42 and '42' coerce to
	// the same slot. Setting one should NOT wake a memo reading the
	// other — but might, documenting the collision if so.
	const m = mutable(new Map())
	m.set(42, 'number')

	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get(42)
	})
	mg()
	expect(calls).toBe(1)

	m.set('42', 'string')
	mg()
	expect(calls).toBe(1)
})

await test('tracker split: NaN as a Map key round-trips', expect => {
	const m = mutable(new Map())
	m.set(NaN, 'nope')
	expect(m.has(NaN)).toBe(true)
	expect(m.get(NaN)).toBe('nope')
	expect(m.size).toBe(1)
})

await test('tracker split: Map.set(NaN, NaN) is a no-op on same-NaN reset', expect => {
	const m = mutable(new Map([['a', NaN]]))
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.get('a')
	})
	mg()
	expect(calls).toBe(1)

	m.set('a', NaN)
	mg()
	expect(calls).toBe(1)
})

await test('tracker split: map.set(true, …) and map.set("true", …) are distinct', expect => {
	const m = mutable(new Map())
	m.set(true, 'bool')
	m.set('true', 'string')

	expect(m.get(true)).toBe('bool')
	expect(m.get('true')).toBe('string')
	expect(m.size).toBe(2)
})

await test('tracker split: precision for boolean vs string key in Map', expect => {
	// booleans route to identityProps Map (Option B), strings to #props.
	// Setting 'true' should NOT wake a memo on has(true).
	const m = mutable(new Map())
	let calls = 0
	const mg = memo(() => {
		calls++
		return m.has(true)
	})
	mg()
	expect(calls).toBe(1)

	m.set('true', 'x')
	mg()
	expect(calls).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  B. Set / Map with unusual contents                                 */
/* ------------------------------------------------------------------ */

await test('set: add and delete the same object identity', expect => {
	const obj = { id: 1 }
	const s = mutable(new Set())
	s.add(obj)
	expect(s.has(obj)).toBe(true)
	s.delete(obj)
	expect(s.has(obj)).toBe(false)
	expect(s.size).toBe(0)
})

await test('set: self-referential — add(s) and iterate', expect => {
	const s = mutable(new Set())
	s.add(s)
	expect(s.has(s)).toBe(true)
	const visited = [...s]
	expect(visited.length).toBe(1)
	expect(visited[0]).toBe(s)
})

await test('map: Map as key round-trips correctly', expect => {
	const innerKey = new Map([['k', 1]])
	const m = mutable(new Map())
	m.set(innerKey, 'found')
	expect(m.has(innerKey)).toBe(true)
	expect(m.get(innerKey)).toBe('found')
})

/* ------------------------------------------------------------------ */
/*  C. Mid-iteration mutation                                          */
/* ------------------------------------------------------------------ */

await test('set: forEach callback deleting earlier item (native semantics)', expect => {
	const s = mutable(new Set([1, 2, 3]))
	const seen = []
	s.forEach(v => {
		if (v === 2) s.delete(1)
		seen.push(v)
	})
	// 1 already visited; delete doesn't affect past.
	expect(seen).toEqual([1, 2, 3])
})

await test('set: forEach callback adding a new value (native sees it)', expect => {
	const s = mutable(new Set([1, 2]))
	const seen = []
	let added = false
	s.forEach(v => {
		seen.push(v)
		if (!added) {
			s.add(99)
			added = true
		}
	})
	expect(seen).toEqual([1, 2, 99])
})

await test('map: iteration reflects concurrent delete', expect => {
	const m = mutable(new Map([['a', 1], ['b', 2], ['c', 3]]))
	const keysSeen = []
	let deleted = false
	for (const k of m.keys()) {
		keysSeen.push(k)
		if (k === 'a' && !deleted) {
			m.delete('c')
			deleted = true
		}
	}
	expect(keysSeen).toEqual(['a', 'b'])
})

/* ------------------------------------------------------------------ */
/*  D. copy() boundary conditions                                      */
/* ------------------------------------------------------------------ */

await test('copy: Map with Map as key copies both key and value deeply', expect => {
	const innerKey = new Map([['k', 1]])
	const outer = new Map([[innerKey, 'value']])
	const c = copy(outer)

	// copy is structurally equivalent but NOT reference-equal.
	expect(c).not.toBe(outer)

	// keys are copied — find the equivalent key.
	const copiedKey = [...c.keys()][0]
	expect(copiedKey).not.toBe(innerKey)
	expect(c.has(copiedKey)).toBe(true)
	expect(c.get(copiedKey)).toBe('value')
})

await test('copy: Set containing a Set', expect => {
	const inner = new Set([1, 2, 3])
	const outer = new Set([inner])
	const c = copy(outer)

	expect(c).not.toBe(outer)
	expect(c.size).toBe(1)
	const copiedInner = [...c][0]
	expect(copiedInner).not.toBe(inner)
	expect(copiedInner instanceof Set).toBe(true)
	expect([...copiedInner]).toEqual([1, 2, 3])
})

await test('copy: class instance preserves prototype', expect => {
	class Foo {
		constructor(v) {
			this.v = v
		}
		getV() {
			return this.v
		}
	}
	const orig = new Foo(5)
	const c = copy(orig)
	expect(c instanceof Foo).toBe(true)
	expect(c.getV()).toBe(5)
	expect(c).not.toBe(orig)
})

await test('copy: getter snapshot — captures value at copy time', expect => {
	let external = 'alpha'
	const orig = {
		get greeting() {
			return 'Hello, ' + external
		},
	}
	const c = copy(orig)
	expect(c.greeting).toBe('Hello, alpha')

	external = 'beta'
	expect(orig.greeting).toBe('Hello, beta') // live on original
	expect(c.greeting).toBe('Hello, alpha') // snapshot on copy
})

await test('copy: throwing getter — copy gets undefined, does not propagate', expect => {
	const orig = {
		get x() {
			throw new Error('bad')
		},
	}
	const c = copy(orig)
	expect(c.x).toBe(undefined)
})

await test('copy: symbol-keyed property is preserved', expect => {
	const sym = Symbol('s')
	const orig = { [sym]: 'kept', a: 1 }
	const c = copy(orig)
	expect(c[sym]).toBe('kept')
	expect(c.a).toBe(1)
})

await test('copy: non-enumerable property is preserved', expect => {
	const orig = {}
	Object.defineProperty(orig, 'hidden', {
		value: 42,
		writable: true,
		enumerable: false,
		configurable: true,
	})
	orig.visible = 1
	const c = copy(orig)
	expect(c.hidden).toBe(42)
	expect(c.visible).toBe(1)
	const desc = Object.getOwnPropertyDescriptor(c, 'hidden')
	expect(desc.enumerable).toBe(false)
})

await test('copy: frozen source produces a frozen copy', expect => {
	const orig = Object.freeze({ a: 1, nested: Object.freeze({ b: 2 }) })
	const c = copy(orig)
	expect(Object.isFrozen(c)).toBe(true)
	expect(Object.isFrozen(c.nested)).toBe(true)
})

/* ------------------------------------------------------------------ */
/*  E. Array defineProperty — weird length semantics                   */
/* ------------------------------------------------------------------ */

await test('array defineProperty: writing length to extend creates sparse tail', expect => {
	const arr = mutable([1, 2, 3])
	Object.defineProperty(arr, 'length', {
		value: 10,
		writable: true,
		enumerable: false,
		configurable: false,
	})
	expect(arr.length).toBe(10)
	expect(arr[5]).toBe(undefined)
	expect(arr[9]).toBe(undefined)
})

await test('array: defineProperty adds sparse index beyond length', expect => {
	const arr = mutable([1, 2])
	Object.defineProperty(arr, 5, {
		value: 'x',
		writable: true,
		enumerable: true,
		configurable: true,
	})
	expect(arr[5]).toBe('x')
	expect(arr.length).toBe(6)
})

/* ------------------------------------------------------------------ */
/*  F. Frozen / sealed interactions                                    */
/* ------------------------------------------------------------------ */

await test('mutable(frozen object) — wrapping succeeds, non-configurable props stay raw', expect => {
	const frozen = Object.freeze({ a: 1, b: 2 })
	const m = mutable(frozen)
	expect(m.a).toBe(1)
	expect(m.b).toBe(2)

	// Writes should throw in strict mode or be no-ops — don't assert
	// the exact outcome, just that the data is still accessible.
	try {
		m.a = 99
	} catch {}
	expect(m.a).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  G. Array length / sparse / index edge cases                        */
/* ------------------------------------------------------------------ */

await test('array: setting length to 0 clears; memo on arr[0] wakes', expect => {
	const arr = mutable([10, 20, 30])
	let calls = 0
	let v
	const m = memo(() => {
		calls++
		v = arr[0]
	})
	m()
	expect(v).toBe(10)
	expect(calls).toBe(1)

	arr.length = 0
	m()
	expect(v).toBe(undefined)
	expect(calls).toBe(2)
	expect(arr.length).toBe(0)
})

await test('array: arr[arr.length] = x extends by 1 and fires length', expect => {
	const arr = mutable([1, 2])
	let lenCalls = 0
	const mLen = memo(() => {
		lenCalls++
		return arr.length
	})
	mLen()
	expect(lenCalls).toBe(1)

	arr[arr.length] = 3
	mLen()
	expect(mLen()).toBe(3)
	expect(lenCalls).toBe(2)
})

await test('array: sparse assignment `arr[5] = x` auto-extends length', expect => {
	const arr = mutable([1])
	arr[5] = 'end'
	expect(arr.length).toBe(6)
	expect(arr[5]).toBe('end')
	expect(arr[3]).toBe(undefined)
})

await test('array: delete arr[i] creates a hole and wakes memo', expect => {
	const arr = mutable([10, 20, 30])
	let calls = 0
	const m = memo(() => {
		calls++
		return arr[1]
	})
	m()
	expect(calls).toBe(1)

	delete arr[1]
	m()
	expect(m()).toBe(undefined)
	expect(calls).toBe(2)
	expect(1 in arr).toBe(false)
})

await test('array: arr[1.5] is a string key, not an index', expect => {
	const arr = mutable([1, 2, 3])
	arr[1.5] = 'float'
	expect(arr.length).toBe(3)
	expect(arr['1.5']).toBe('float')
	expect(Object.keys(arr)).toEqual(['0', '1', '2', '1.5'])
})

await test('array: arr[-1] is a string key, does not behave like Python negative index', expect => {
	const arr = mutable([1, 2, 3])
	arr[-1] = 'tail'
	expect(arr.length).toBe(3)
	expect(arr[-1]).toBe('tail')
	expect(arr[2]).toBe(3)
})

/* ------------------------------------------------------------------ */
/*  H. Map with -0, BigInt, and other primitives                       */
/* ------------------------------------------------------------------ */

await test('map: +0 and -0 keys collapse (SameValueZero)', expect => {
	const m = mutable(new Map())
	m.set(0, 'plus')
	m.set(-0, 'minus')
	// Map uses SameValueZero — same key.
	expect(m.size).toBe(1)
	expect(m.get(0)).toBe('minus')
	expect(m.get(-0)).toBe('minus')
})

await test('map: BigInt key distinct from number key', expect => {
	const m = mutable(new Map())
	m.set(1n, 'big')
	m.set(1, 'num')
	expect(m.size).toBe(2)
	expect(m.get(1n)).toBe('big')
	expect(m.get(1)).toBe('num')
})

await test('map: undefined and null as keys are distinct', expect => {
	const m = mutable(new Map())
	m.set(undefined, 'u')
	m.set(null, 'n')
	expect(m.size).toBe(2)
	expect(m.get(undefined)).toBe('u')
	expect(m.get(null)).toBe('n')
})

/* ------------------------------------------------------------------ */
/*  I. Set edge values                                                 */
/* ------------------------------------------------------------------ */

await test('set: adding undefined is a valid value', expect => {
	const s = mutable(new Set())
	s.add(undefined)
	expect(s.has(undefined)).toBe(true)
	expect(s.size).toBe(1)
})

await test('set: adding NaN uses SameValueZero (has(NaN) is true)', expect => {
	const s = mutable(new Set())
	s.add(NaN)
	expect(s.has(NaN)).toBe(true)
	s.add(NaN)
	expect(s.size).toBe(1)
})

await test('set: spread into array preserves insertion order', expect => {
	const s = mutable(new Set([3, 1, 2]))
	expect([...s]).toEqual([3, 1, 2])
})

await test('set: two iterators over the same set are independent', expect => {
	const s = mutable(new Set([1, 2, 3]))
	const a = s.values()
	const b = s.values()
	expect(a.next().value).toBe(1)
	expect(b.next().value).toBe(1)
	expect(a.next().value).toBe(2)
	expect(b.next().value).toBe(2)
})

/* ------------------------------------------------------------------ */
/*  J. Reactivity oddities                                             */
/* ------------------------------------------------------------------ */

await test('reactivity: memo reading two separate mutables', expect => {
	const a = mutable({ n: 1 })
	const b = mutable({ n: 10 })
	let calls = 0
	const m = memo(() => {
		calls++
		return a.n + b.n
	})
	m()
	expect(m()).toBe(11)
	expect(calls).toBe(1)

	a.n = 2
	m()
	expect(m()).toBe(12)
	expect(calls).toBe(2)

	b.n = 20
	m()
	expect(m()).toBe(22)
	expect(calls).toBe(3)
})

await test('reactivity: writing to a key deletes a dependent memo-tracked property', expect => {
	const obj = mutable({ x: 1 })
	let calls = 0
	let snapshot
	const m = memo(() => {
		calls++
		snapshot = obj.x
	})
	m()
	expect(snapshot).toBe(1)
	expect(calls).toBe(1)

	delete obj.x
	m()
	expect(snapshot).toBe(undefined)
	expect(calls).toBe(2)
})

await test('reactivity: recursive memo reading its own mutable', expect => {
	const obj = mutable({ a: 1, b: 2 })
	let calls = 0
	const m = memo(() => {
		calls++
		return obj.a + obj.b
	})
	expect(m()).toBe(3)
	expect(calls).toBe(1)

	obj.a = 10
	expect(m()).toBe(12)
	expect(calls).toBe(2)
})

/* ------------------------------------------------------------------ */
/*  K. Serialization / inspection                                      */
/* ------------------------------------------------------------------ */

await test('JSON.stringify: mutable object serializes transparently', expect => {
	const m = mutable({ a: 1, nested: { b: 2 } })
	expect(JSON.stringify(m)).toBe('{"a":1,"nested":{"b":2}}')
})

await test('JSON.stringify: mutable array serializes transparently', expect => {
	const m = mutable([1, 2, { c: 3 }])
	expect(JSON.stringify(m)).toBe('[1,2,{"c":3}]')
})

await test('JSON.stringify: mutable Set is NOT serialized as array (matches native Set)', expect => {
	const m = mutable(new Set([1, 2, 3]))
	// Native Set stringifies to {} (Set has no enumerable own data props).
	expect(JSON.stringify(m)).toBe('{}')
})

/* ------------------------------------------------------------------ */
/*  L. Class instance semantics                                        */
/* ------------------------------------------------------------------ */

await test('class: instance method works through mutable proxy', expect => {
	class Counter {
		value = 0
		increment() {
			this.value++
			return this.value
		}
	}
	const c = mutable(new Counter())
	expect(c.increment()).toBe(1)
	expect(c.increment()).toBe(2)
	expect(c.value).toBe(2)
})

await test('class: static members unaffected by mutable wrapping', expect => {
	class Holder {
		static TAG = 'tag'
	}
	const h = mutable(new Holder())
	expect(h.constructor.TAG).toBe('tag')
	expect(h.constructor).toBe(Holder)
})

/* ------------------------------------------------------------------ */
/*  M. Nested mutables                                                 */
/* ------------------------------------------------------------------ */

await test('nested: mutable returns same proxy for same target', expect => {
	const raw = { a: 1 }
	const a = mutable(raw)
	const b = mutable(raw)
	expect(a).toBe(b)
})

await test('nested: mutable(mutable(x)) is idempotent', expect => {
	const raw = { a: 1 }
	const a = mutable(raw)
	const b = mutable(a)
	expect(a).toBe(b)
})

await test('nested: object reaching itself via cycle', expect => {
	const raw = { a: 1 }
	raw.self = raw
	const m = mutable(raw)
	expect(m.self).toBe(m)
	expect(m.self.self).toBe(m)
	expect(m.self.self.self.a).toBe(1)
})

/* ------------------------------------------------------------------ */
/*  N. defineProperty trap — valuesWrite over-notify check            */
/* ------------------------------------------------------------------ */

await test('defineProperty: same-value redefine on object does NOT wake Object.keys subscribers', expect => {
	// Memo reads Object.keys → subscribes to keysRead sentinel.
	// Same-enum same-value redefine should not wake it.
	const obj = mutable({ a: 1 })
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(obj).join(',')
	})
	m()
	expect(calls).toBe(1)

	Object.defineProperty(obj, 'a', {
		value: 1,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(calls).toBe(1)
})

await test('defineProperty: same-value redefine on array does NOT wake forEach (valuesRead) subscriber', expect => {
	// forEach on a mutable array subscribes to valuesRead sentinel.
	// A same-value defineProperty should NOT wake it. If this fails,
	// the trap's unconditional valuesWrite() is over-notifying.
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		let sum = 0
		arr.forEach(v => (sum += v))
		return sum
	})
	m()
	expect(m()).toBe(6)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 0, {
		value: 1,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(m()).toBe(6)
	expect(calls).toBe(1)
})

await test('defineProperty: same-accessor redefine on object does NOT wake Object.keys', expect => {
	const obj = mutable({
		get fn() {
			return 42
		},
	})
	let calls = 0
	const m = memo(() => {
		calls++
		return Object.keys(obj).join(',')
	})
	m()
	expect(calls).toBe(1)

	const sameGetter = Object.getOwnPropertyDescriptor(obj, 'fn').get
	Object.defineProperty(obj, 'fn', {
		get: sameGetter,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(calls).toBe(1)
})

await test('defineProperty: different-value redefine on array DOES wake forEach', expect => {
	// Positive counterpart to test 49 — make sure the gating fix
	// doesn't suppress legitimate changes.
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		let sum = 0
		arr.forEach(v => (sum += v))
		return sum
	})
	m()
	expect(m()).toBe(6)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 0, {
		value: 100,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(m()).toBe(105)
	expect(calls).toBe(2)
})

await test('defineProperty: new-index on array DOES wake forEach', expect => {
	const arr = mutable([1, 2])
	let calls = 0
	const m = memo(() => {
		calls++
		let sum = 0
		arr.forEach(v => (sum += v))
		return sum
	})
	m()
	expect(m()).toBe(3)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 2, {
		value: 10,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(m()).toBe(13)
	expect(calls).toBe(2)
})

await test('defineProperty: value: undefined on array DOES wake forEach (value changed)', expect => {
	const arr = mutable([1, 2, 3])
	let calls = 0
	const m = memo(() => {
		calls++
		let sum = 0
		arr.forEach(v => (sum += typeof v === 'number' ? v : 0))
		return sum
	})
	m()
	expect(m()).toBe(6)
	expect(calls).toBe(1)

	Object.defineProperty(arr, 0, {
		value: undefined,
		writable: true,
		enumerable: true,
		configurable: true,
	})
	m()
	expect(m()).toBe(5)
	expect(calls).toBe(2)
})
