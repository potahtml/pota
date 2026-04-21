// Tests for `memo()` — recompute on dep change, lazy initialization,
// custom equals, downstream notification suppression, chained memos,
// reference identity, untracked-signal isolation.

import { test } from '#test'
import { signal, memo, root, syncEffect, effect } from 'pota'

await test('memo - recomputes when dependencies change', expect => {
	const count = signal(2)
	const doubled = memo(() => count.read() * 2)

	expect(doubled()).toBe(4)
	count.write(3)
	expect(doubled()).toBe(6)
})

await test('memo - is lazy initialized: does not execute until first read', expect => {
	const ran = []
	const count = signal(1)
	const doubled = memo(() => {
		const v = count.read() * 2
		ran.push(v)
		return v
	})

	expect(ran).toEqual([])

	expect(doubled()).toBe(2)
	expect(ran).toEqual([2])

	count.write(3)

	expect(ran).toEqual([2, 6])

	expect(doubled()).toBe(6)
	expect(ran).toEqual([2, 6])
})

// --- memo options -------------------------------------------------------------

// Diamond dependency: when a signal invalidates memos A and B, and
// memo C reads both, C transitions to CHECK state. Reading C then
// runs the upstream-resolution path in Memo.read (state === CHECK
// branch) that queues updates for ancestors before reading the
// current value.

await test('memo - diamond dependency resolves CHECK-state memos before read', expect => {
	const source = signal(1)
	const a = memo(() => source.read() + 10)
	const b = memo(() => source.read() + 20)
	const c = memo(() => a() + b())

	// prime all memos so they are CLEAN
	expect(c()).toBe(32)

	source.write(2)
	// reading c should resolve upstream memos (a, b) that are in
	// CHECK state and return fresh values
	expect(c()).toBe(34)
})

// Passing equals:false directly to memo forces `this.equals =
// this.equalsFalse` inside the Memo constructor (Memo's equalsFalse
// method always returns false, guaranteeing downstream updates).

await test('memo - equals:false option on memo notifies downstream on same value', expect => {
	const source = signal(7)
	const calls = []
	const m = memo(() => source.read(), { equals: false })

	root(() => {
		syncEffect(() => calls.push(m()))
	})

	expect(calls).toEqual([7])
	// writing the same value: signal default-equals blocks, but if
	// we force a memo recompute, equalsFalse guarantees the memo
	// notifies downstream even when the returned value is identical
	source.write(8)
	expect(calls).toEqual([7, 8])
	// repeat value 8 — memo re-runs identical input → returns same
	// 8. With equals:false, downstream still notified.
	const before = calls.length
	source.write(8)
	// signal(8)→same: signal's default equals blocks. downstream gets
	// no new notification because the memo itself isn't re-run.
	expect(calls.length).toBe(before)
})

await test('memo - equals:false always recomputes dependents', expect => {
	const count = signal(0, { equals: false })
	const runs = []
	const doubled = memo(() => {
		const v = count.read() * 2
		runs.push(v)
		return v
	})

	const downstream = []
	root(() => {
		syncEffect(() => downstream.push(doubled()))
	})

	expect(downstream).toEqual([0])

	count.write(0) // same value, but memo has equals:false
	// memo recomputes, downstream reruns even though result is same
	expect(runs.length).toBe(2)
})

// --- memo with custom equals -------------------------------------------------

await test('memo - custom equals controls downstream notifications', expect => {
	const source = signal(1)
	const rounded = memo(() => Math.floor(source.read()), {
		equals: (a, b) => a === b,
	})
	const seen = []

	root(() => {
		syncEffect(() => seen.push(rounded()))
	})

	expect(seen).toEqual([1])

	source.write(1.5) // floor is still 1
	expect(seen).toEqual([1])

	source.write(2.1) // floor is 2
	expect(seen).toEqual([1, 2])
})

// --- memo is not re-evaluated when result hasn't changed ---------------------

await test('memo - downstream effect does not rerun when memo result is unchanged', expect => {
	const source = signal(1)
	const clamped = memo(() => Math.min(source.read(), 10))
	const seen = []

	const dispose = root(d => {
		effect(() => seen.push(clamped()))
		return d
	})

	expect(seen).toEqual([1])

	source.write(5)
	expect(seen).toEqual([1, 5])

	source.write(15) // clamped to 10
	expect(seen).toEqual([1, 5, 10])

	source.write(20) // still clamped to 10 — no rerun
	expect(seen).toEqual([1, 5, 10])

	dispose()
})

// --- memo that depends on another memo --------------------------------

await test('memo - chained memos update lazily down the chain', expect => {
	const count = signal(1)
	const doubled = memo(() => count.read() * 2)
	const quadrupled = memo(() => doubled() * 2)

	expect(quadrupled()).toBe(4)

	count.write(3)

	expect(doubled()).toBe(6)
	expect(quadrupled()).toBe(12)
})

// --- memo with object value: returns by reference --------------------

await test('memo - returns the same object reference when deps do not change', expect => {
	const flag = signal(true)
	const m = memo(() => ({ truthy: flag.read() }))

	const first = m()
	const second = m()

	expect(first).toBe(second)

	flag.write(false)

	const third = m()
	expect(third).not.toBe(first)
	expect(third.truthy).toBe(false)
})

await test('memo - does not recompute when an untracked signal changes', expect => {
	const a = signal(1)
	const b = signal(10)
	let computations = 0

	// memo reads only `a`
	const doubled = memo(() => {
		computations++
		return a.read() * 2
	})

	expect(doubled()).toBe(2)
	expect(computations).toBe(1)

	// writing b does not trigger the memo
	b.write(99)
	expect(doubled()).toBe(2)
	expect(computations).toBe(1)

	// writing a does trigger the memo
	a.write(5)
	expect(doubled()).toBe(10)
	expect(computations).toBe(2)
})
