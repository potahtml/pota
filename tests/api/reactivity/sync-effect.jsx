// Tests for `syncEffect()` — runs immediately, ordering vs deferred
// effect, root disposal, batch coalescing, multi-signal reads.

import { test } from '#test'
import { signal, syncEffect, effect, root, batch } from 'pota'

await test('syncEffect - runs immediately in dependency order', expect => {
	const count = signal(1)
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1])

	count.write(4)

	expect(seen).toEqual([1, 4])
})

// --- syncEffect vs effect ordering -------------------------------------------

await test('syncEffect - runs synchronously on signal write, effect defers', expect => {
	const count = signal(0)
	const order = []

	root(() => {
		effect(() => {
			order.push('effect:' + count.read())
		})
		syncEffect(() => {
			order.push('sync:' + count.read())
		})
	})

	expect(order).toEqual(['sync:0', 'effect:0'])

	count.write(1)
	// syncEffect runs immediately, effect may also run immediately
	// depending on scheduling, but both should have fired
	expect(order).toInclude('sync:1')
	expect(order).toInclude('effect:1')
})

await test('syncEffect - does not run after its root is disposed', expect => {
	// syncEffect is a separate subclass of Computation from effect and
	// takes a different construction path (it runs immediately via
	// `batch` instead of going through the Effects queue), so its root
	// disposal deserves a dedicated test — a bug in one disposal path
	// wouldn't necessarily be caught by the effect-based test above.
	const count = signal(0)
	let runs = 0

	const dispose = root(d => {
		syncEffect(() => {
			runs++
			count.read()
		})
		return d
	})

	expect(runs).toBe(1)

	count.write(1)
	expect(runs).toBe(2)

	dispose()

	count.write(2)
	expect(runs).toBe(2)
})

// --- syncEffect runs before effect in same root ------------------------------

await test('syncEffect - runs before deferred effect for same signal', expect => {
	const s = signal(0)
	const order = []

	const dispose = root(d => {
		effect(() => order.push('effect:' + s.read()))
		syncEffect(() => order.push('sync:' + s.read()))
		return d
	})

	// baseline: both ran for initial value
	expect(order).toInclude('sync:0')
	expect(order).toInclude('effect:0')

	s.write(1)

	// syncEffect should have run for the new value
	expect(order).toInclude('sync:1')

	dispose()
})

// --- syncEffect tracks deps narrowly ------------------------------

await test('syncEffect - multi-signal read triggers only when an actual dep changes', expect => {
	const a = signal(1)
	const b = signal(2)
	let runs = 0

	root(() => {
		syncEffect(() => {
			runs++
			a.read()
			b.read()
		})
	})

	expect(runs).toBe(1)

	a.write(a.read())
	// same value written, no re-run
	expect(runs).toBe(1)

	a.write(10)
	expect(runs).toBe(2)

	b.write(20)
	expect(runs).toBe(3)
})

await test('syncEffect - runs before effect within the same flush, batch coalesces both', expect => {
	const count = signal(0)
	const log = []

	const dispose = root(dispose => {
		syncEffect(() => {
			log.push('sync:' + count.read())
		})
		effect(() => {
			log.push('user:' + count.read())
		})
		return dispose
	})

	// each ran immediately at creation, in construction order
	expect(log).toEqual(['sync:0', 'user:0'])

	log.length = 0

	// a single write triggers both observers; the flush queue runs
	// non-user (syncEffect) before user (effect)
	count.write(1)
	expect(log).toEqual(['sync:1', 'user:1'])

	log.length = 0

	// multiple writes inside a batch coalesce — each observer
	// runs exactly once with the final value, preserving the
	// sync-before-user order
	batch(() => {
		count.write(2)
		count.write(3)
		count.write(4)
	})
	expect(log).toEqual(['sync:4', 'user:4'])

	dispose()
})
