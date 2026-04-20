/** @jsxImportSource pota */

/**
 * Tests for the `store` API — a `[DeepReadonly<T>, setStore]`
 * tuple over a mutable, with batched writes.
 */

import { test as _test } from '#test'

import { syncEffect as effect, memo } from 'pota'
import { mutable, store } from 'pota/store'

const test = _test

/* ================================================================= */
/*  A. Shape                                                           */
/* ================================================================= */

await test('store: returns a 2-tuple', expect => {
	const result = store({ a: 1 })
	expect(Array.isArray(result)).toBe(true)
	expect(result.length).toBe(2)
})

await test('store: second element is a function', expect => {
	const [, setStore] = store({ a: 1 })
	expect(typeof setStore).toBe('function')
})

await test('store: first element reads the initial data', expect => {
	const [s] = store({ a: 1, b: 'hi' })
	expect(s.a).toBe(1)
	expect(s.b).toBe('hi')
})

/* ================================================================= */
/*  B. setStore basics                                                 */
/* ================================================================= */

await test('store: setStore mutates the store via its callback', expect => {
	const [s, setStore] = store({ a: 1 })
	setStore(draft => {
		draft.a = 42
	})
	expect(s.a).toBe(42)
})

await test('store: setStore callback receives the same reference as the store', expect => {
	const [s, setStore] = store({ a: 1 })
	let received
	setStore(draft => {
		received = draft
	})
	expect(received).toBe(s)
})

await test('store: setStore can read + write in the same call', expect => {
	const [s, setStore] = store({ a: 1 })
	setStore(draft => {
		draft.a = draft.a + 10
	})
	expect(s.a).toBe(11)
})

await test('store: setStore supports nested property writes', expect => {
	const [s, setStore] = store({ nested: { deep: { v: 1 } } })
	setStore(draft => {
		draft.nested.deep.v = 99
	})
	expect(s.nested.deep.v).toBe(99)
})

await test('store: setStore can add new keys', expect => {
	const [s, setStore] = store(/** @type {Record<string, any>} */ ({}))
	setStore(draft => {
		draft.created = 'hello'
	})
	expect(s.created).toBe('hello')
})

await test('store: setStore can delete keys', expect => {
	const [s, setStore] = store(
		/** @type {Record<string, any>} */ ({ a: 1, b: 2 }),
	)
	setStore(draft => {
		delete draft.a
	})
	expect('a' in s).toBe(false)
	expect(s.b).toBe(2)
})

/* ================================================================= */
/*  C. Batching                                                        */
/* ================================================================= */

await test('store: setStore batches multiple writes — effect fires once', expect => {
	const [s, setStore] = store({ a: 0, b: 0, c: 0 })
	let calls = 0
	effect(() => {
		calls++
		s.a
		s.b
		s.c
	})
	expect(calls).toBe(1)

	setStore(draft => {
		draft.a = 1
		draft.b = 2
		draft.c = 3
	})

	// Single flush for the whole callback, regardless of how many
	// signals were written.
	expect(calls).toBe(2)
	expect(s.a).toBe(1)
	expect(s.b).toBe(2)
	expect(s.c).toBe(3)
})

await test('store: many rapid writes inside setStore cause one rerun per effect', expect => {
	const [s, setStore] = store({ v: 0 })
	let calls = 0
	effect(() => {
		calls++
		s.v
	})
	expect(calls).toBe(1)

	setStore(draft => {
		for (let i = 0; i < 100; i++) draft.v = i
	})
	expect(calls).toBe(2)
	expect(s.v).toBe(99)
})

await test('store: two separate setStore calls produce two flushes', expect => {
	const [s, setStore] = store({ a: 0 })
	let calls = 0
	effect(() => {
		calls++
		s.a
	})
	expect(calls).toBe(1)

	setStore(d => {
		d.a = 1
	})
	setStore(d => {
		d.a = 2
	})
	expect(calls).toBe(3)
	expect(s.a).toBe(2)
})

await test('store: nested setStore calls still flush once', expect => {
	const [s, setStore] = store({ a: 0, b: 0 })
	let calls = 0
	effect(() => {
		calls++
		s.a
		s.b
	})
	expect(calls).toBe(1)

	setStore(outer => {
		outer.a = 1
		setStore(inner => {
			inner.b = 2
		})
	})
	// Nested batch collapses to the outer batch — one flush.
	expect(calls).toBe(2)
	expect(s.a).toBe(1)
	expect(s.b).toBe(2)
})

/* ================================================================= */
/*  D. Reactivity (reads see batched result)                           */
/* ================================================================= */

await test('store: memos re-compute after setStore', expect => {
	const [s, setStore] = store({ a: 1, b: 2 })
	const sum = memo(() => s.a + s.b)
	expect(sum()).toBe(3)

	setStore(d => {
		d.a = 10
		d.b = 20
	})
	expect(sum()).toBe(30)
})

await test('store: memo re-computes once per setStore call even with many writes', expect => {
	const [s, setStore] = store({ a: 0, b: 0 })
	let computes = 0
	const sum = memo(() => {
		computes++
		return s.a + s.b
	})
	sum()
	expect(computes).toBe(1)

	setStore(d => {
		d.a = 1
		d.b = 2
		d.a = 100
		d.b = 200
	})
	sum()
	expect(computes).toBe(2)
	expect(sum()).toBe(300)
})

/* ================================================================= */
/*  E. Array / Map / Set sources                                       */
/* ================================================================= */

await test('store: works with array source', expect => {
	const [s, setStore] = store([1, 2, 3])
	let calls = 0
	effect(() => {
		calls++
		s.length
	})
	expect(calls).toBe(1)

	setStore(arr => {
		arr.push(4)
		arr.push(5)
	})
	expect(calls).toBe(2)
	expect([...s]).toEqual([1, 2, 3, 4, 5])
})

await test('store: works with Map source', expect => {
	const [s, setStore] = store(new Map([['a', 1]]))
	setStore(m => {
		m.set('b', 2)
		m.set('c', 3)
	})
	expect(s.get('a')).toBe(1)
	expect(s.get('b')).toBe(2)
	expect(s.get('c')).toBe(3)
	expect(s.size).toBe(3)
})

await test('store: works with Set source', expect => {
	const [s, setStore] = store(new Set([1, 2]))
	setStore(set => {
		set.add(3)
		set.add(4)
	})
	expect(s.has(1)).toBe(true)
	expect(s.has(4)).toBe(true)
	expect(s.size).toBe(4)
})

/* ================================================================= */
/*  F. Identity / reference behavior                                   */
/* ================================================================= */

await test('store: without clone, mutating source directly leaks into store', expect => {
	// Documents the default (non-clone) behavior: source becomes
	// the backing data. External mutation of source is visible
	// via the store proxy.
	const source = { a: 1 }
	const [s] = store(source)
	source.a = 99
	expect(s.a).toBe(99)
})

await test('store: with clone=true, external source mutations do NOT leak', expect => {
	const source = { a: 1, nested: { b: 2 } }
	const [s] = store(source, true)
	source.a = 99
	source.nested.b = 999
	expect(s.a).toBe(1)
	expect(s.nested.b).toBe(2)
})

await test('store: wrapping an already-mutable source returns the same mutable', expect => {
	const m = mutable({ a: 1 })
	const [s, setStore] = store(m)
	expect(s).toBe(m)

	setStore(draft => {
		draft.a = 42
	})
	expect(m.a).toBe(42)
})

/* ================================================================= */
/*  G. Callback semantics                                              */
/* ================================================================= */

await test('store: setStore callback return value is ignored', expect => {
	const [s, setStore] = store({ a: 1 })
	const r = setStore(draft => {
		draft.a = 2
		return 'ignored'
	})
	expect(r).toBe(undefined)
	expect(s.a).toBe(2)
})

await test('store: setStore callback throwing propagates; partial writes visible', expect => {
	const [s, setStore] = store({ a: 1, b: 1 })
	let threw
	try {
		setStore(draft => {
			draft.a = 10
			throw new Error('boom')
		})
	} catch (e) {
		threw = e
	}
	expect(threw && /** @type {Error} */ (threw).message).toBe('boom')
	// The mutation before the throw is already applied.
	expect(s.a).toBe(10)
	expect(s.b).toBe(1)
})

/* ================================================================= */
/*  H. Does not subscribe the caller                                   */
/* ================================================================= */

await test('store: setStore inside a memo does not subscribe the memo (writes only)', expect => {
	const [, setStore] = store({ a: 0 })
	const unrelated = mutable({ x: 1 })
	let counter = 0
	let calls = 0
	const m = memo(() => {
		calls++
		setStore(draft => {
			draft.a = counter++
		})
	})
	m()
	expect(calls).toBe(1)

	unrelated.x = 2
	m()
	expect(calls).toBe(1)
})

await test('store: setStore callback reads are untracked — no self-feedback', expect => {
	// Inside a memo, read-then-write on the same key inside the
	// mutator would otherwise subscribe the memo to that key and
	// cause it to re-run immediately on the write (infinite loop).
	// `untrack` inside setStore breaks that.
	const [s, setStore] = store({ a: 0 })
	let calls = 0
	const m = memo(() => {
		calls++
		setStore(draft => {
			draft.a = draft.a + 1
		})
	})
	m()
	expect(calls).toBe(1)
	expect(s.a).toBe(1)

	// Re-invoking the memo manually triggers another increment;
	// without untrack, even calling m() once could infinite-loop
	// because the write inside setStore would invalidate the
	// subscription the read just created.
	m()
	expect(calls).toBe(1) // memo didn't subscribe to `a`
	expect(s.a).toBe(1) // memo cached; didn't re-run
})

await test('store: setStore reads of other mutables are also untracked', expect => {
	const [, setStore] = store({ a: 0 })
	const other = mutable({ v: 10 })
	let calls = 0
	const m = memo(() => {
		calls++
		setStore(draft => {
			// Reading `other.v` would normally subscribe the memo.
			// Inside setStore's untrack, the subscription is
			// suppressed.
			draft.a = other.v
		})
	})
	m()
	expect(calls).toBe(1)

	other.v = 99
	m()
	expect(calls).toBe(1)
})

await test('store: untrack inside setStore does not leak to sibling reads', expect => {
	// If the memo ALSO reads the store outside setStore, those
	// reads still subscribe normally — untrack is scoped to the
	// mutator body only.
	const [s, setStore] = store({ a: 0 })
	let calls = 0
	const m = memo(() => {
		calls++
		const snapshot = s.a // tracked read
		setStore(draft => {
			// untracked read/write
			draft.a // read (untracked)
		})
		return snapshot
	})
	m()
	expect(calls).toBe(1)

	// External write to `a` wakes m because of the tracked read
	// outside setStore.
	setStore(d => {
		d.a = 99
	})
	m()
	expect(calls).toBe(2)
})
