// Tests for `effect()` and `asyncEffect()` — re-subscription, diamond
// dependencies, root disposal, multi-signal reads, cleanup ordering.

import { test, microtask, macrotask } from '#test'
import {
	signal,
	effect,
	cleanup,
	asyncEffect,
	root,
	memo,
} from 'pota'

await test('effect and cleanup - reruns tracked work and cleans previous run', expect => {
	const count = signal(1)
	const seen = []
	const cleaned = []

	root(() => {
		effect(() => {
			const value = count.read()
			seen.push(value)
			cleanup(() => cleaned.push(value))
		})
	})

	expect(seen).toEqual([1])
	expect(cleaned).toEqual([])

	count.write(2)

	expect(seen).toEqual([1, 2])
	expect(cleaned).toEqual([1])
})

await test('asyncEffect - queues async runs sequentially', async expect => {
	const value = signal('a')
	const seen = []

	root(() => {
		asyncEffect(async previous => {
			if (previous) {
				await previous
			}
			seen.push(value.read())
			await macrotask()
		})
	})

	await macrotask()
	value.write('b')
	value.write('c')
	await macrotask()
	await macrotask()
	await macrotask()

	expect(seen).toEqual(['a', 'b', 'c'])
})

// --- effect does not return cleanup -----------------------------------------------

await test('effect - does not return cleanup', expect => {
	const count = signal(1)
	const seen = []

	root(() => {
		effect(() => {
			const v = count.read()
			seen.push('run:' + v)
			cleanup(() => seen.push('cleanup:' + v))
		})
	})

	expect(seen).toEqual(['run:1'])

	count.write(2)
	expect(seen).toEqual(['run:1', 'cleanup:1', 'run:2'])
})

// --- effect re-subscribes to different signals -------------------------------

await test('effect - re-subscribes when reading different signals per run', expect => {
	const toggle = signal(true)
	const a = signal('A')
	const b = signal('B')
	const seen = []

	root(() => {
		effect(() => {
			seen.push(toggle.read() ? a.read() : b.read())
		})
	})

	expect(seen).toEqual(['A'])

	a.write('A2')
	expect(seen).toEqual(['A', 'A2'])

	// switch branch: now tracks b, not a
	toggle.write(false)
	expect(seen).toEqual(['A', 'A2', 'B'])

	// a change should NOT trigger (no longer tracked)
	a.write('A3')
	expect(seen).toEqual(['A', 'A2', 'B'])

	// b change should trigger
	b.write('B2')
	expect(seen).toEqual(['A', 'A2', 'B', 'B2'])
})

// --- effect diamond dependency -----------------------------------------------

await test('effect - diamond dependency runs effect once per batch', expect => {
	const source = signal(1)
	const left = memo(() => source.read() * 2)
	const right = memo(() => source.read() * 3)
	const seen = []

	root(() => {
		effect(() => seen.push(left() + right()))
	})

	expect(seen).toEqual([5])

	source.write(2)
	expect(seen).toEqual([5, 10])
})

// --- effect does not run after root disposal ---------------------------------

await test('effect - does not run after its root is disposed', expect => {
	const trigger = signal(0)
	const seen = []

	const dispose = root(d => {
		effect(() => seen.push(trigger.read()))
		return d
	})

	expect(seen).toEqual([0])

	dispose()

	trigger.write(1)
	expect(seen).toEqual([0])
})

// --- cleanup gets called with previous return value via effect ---

await test('effect - cleanup registered via cleanup() runs before the next invocation', async expect => {
	const s = signal(0)
	const order = []

	const dispose = root(d => {
		effect(() => {
			const value = s.read()
			order.push('run:' + value)
			// pota effects don't capture return values — cleanups
			// must be registered explicitly via cleanup()
			cleanup(() => order.push('cleanup:' + value))
		})
		return d
	})

	await microtask()
	await microtask()

	// first run: no cleanup yet
	expect(order).toEqual(['run:0'])

	s.write(1)
	await microtask()
	await microtask()

	// cleanup from first run, then second run
	expect(order).toEqual(['run:0', 'cleanup:0', 'run:1'])

	dispose()
})

await test('effect - nested effect is disposed when parent effect re-runs', expect => {
	const outer = signal(0)
	const inner = signal('a')
	const seen = []

	const dispose = root(d => {
		effect(() => {
			const o = outer.read()
			effect(() => {
				seen.push(`${o}:${inner.read()}`)
			})
		})
		return d
	})

	expect(seen).toEqual(['0:a'])

	inner.write('b')
	expect(seen).toEqual(['0:a', '0:b'])

	// outer re-runs → inner is re-created, old inner effect disposed
	outer.write(1)
	expect(seen).toEqual(['0:a', '0:b', '1:b'])

	inner.write('c')
	// only one inner effect (the new one) should run
	expect(seen).toEqual(['0:a', '0:b', '1:b', '1:c'])

	dispose()
})

await test('effect - rerun disposes all old owned children before the new run', async expect => {
	const trigger = signal(0)
	const events = []

	const dispose = root(d => {
		effect(() => {
			const n = trigger.read()
			events.push('run:' + n)
			cleanup(() => events.push('cleanup:' + n))
		})
		return d
	})

	await microtask()
	events.length = 0

	trigger.write(1)
	await microtask()
	await microtask()

	// cleanup from previous run must fire before the new run
	const cleanupIndex = events.indexOf('cleanup:0')
	const runIndex = events.indexOf('run:1')
	expect(cleanupIndex < runIndex).toBe(true)

	dispose()
})
