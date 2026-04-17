// Tests for `on()` — explicit dependency tracking, multiple deps,
// body-read isolation.

import { test } from '#test'
import { signal, on, batch, memo, root } from 'pota'

await test('on - tracks only explicit dependencies', expect => {
	const trigger = signal(1)
	const incidental = signal('a')
	const seen = []

	root(() => {
		on(
			() => trigger.read(),
			() => {
				seen.push([trigger.read(), incidental.read()])
			},
		)
	})

	expect(seen).toEqual([[1, 'a']])

	incidental.write('b')
	expect(seen).toEqual([[1, 'a']])

	trigger.write(2)
	expect(seen).toEqual([
		[1, 'a'],
		[2, 'b'],
	])
})

// --- on with multiple dependencies -------------------------------------------

await test('on - fires when any of multiple tracked dependencies change', expect => {
	const a = signal(1)
	const b = signal(2)
	const seen = []

	root(() => {
		on(
			() => [a.read(), b.read()],
			() => seen.push(a.read() + b.read()),
		)
	})

	expect(seen).toEqual([3])

	a.write(10)
	expect(seen).toEqual([3, 12])

	b.write(20)
	expect(seen).toEqual([3, 12, 30])
})

// --- on with a reactive expression ----------------------------------

await test('on - only triggers on explicit dep change, not on body read', expect => {
	const dep = signal(1)
	const other = signal(100)
	const runs = []

	// `on(depend, fn)` already creates an internal effect — it is a
	// factory, not a function you pass to `effect` / `syncEffect`.
	// The first argument is the tracking accessor (here dep.read).
	root(() => {
		on(dep.read, () => {
			runs.push([dep.read(), other.read()])
		})
	})

	expect(runs.length).toBe(1)

	// writing `other` should not trigger (read was untracked in body)
	other.write(200)
	expect(runs.length).toBe(1)

	// writing `dep` triggers
	dep.write(2)
	expect(runs.length).toBe(2)
	expect(runs[1][0]).toBe(2)
})

// --- on stops firing after its owner is disposed --------------------

await test('on - stops firing after owner is disposed', expect => {
	const dep = signal(0)
	const runs = []

	const dispose = root(d => {
		on(dep.read, () => runs.push(dep.read()))
		return d
	})

	expect(runs).toEqual([0])

	dep.write(1)
	expect(runs).toEqual([0, 1])

	dispose()

	dep.write(2)
	expect(runs).toEqual([0, 1]) // no further runs after dispose
})

// --- on inside batch fires once per batch ---------------------------

await test('on - batched writes produce a single run', expect => {
	const a = signal(1)
	const b = signal(2)
	const runs = []

	root(() => {
		on(
			() => [a.read(), b.read()],
			() => runs.push([a.read(), b.read()]),
		)
	})

	expect(runs).toEqual([[1, 2]])

	batch(() => {
		a.write(10)
		b.write(20)
	})

	// Only ONE re-run even though two tracked deps changed.
	expect(runs).toEqual([
		[1, 2],
		[10, 20],
	])
})

// --- on with a memo as dependency -----------------------------------

await test('on - re-runs when a tracked memo value changes', expect => {
	const a = signal(1)
	const b = signal(2)
	const seen = []

	root(() => {
		const sum = memo(() => a.read() + b.read())
		// `on(depend, fn)` calls `fn()` without arguments — read the
		// memo inside the body (untracked, so only `depend` drives
		// subscriptions).
		on(sum, () => seen.push(sum()))
	})

	expect(seen).toEqual([3])

	a.write(4)
	expect(seen).toEqual([3, 6])

	b.write(10)
	expect(seen).toEqual([3, 6, 14])
})
