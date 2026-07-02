// REGRESSION — documentation/improvements.md: "Effects die
// permanently when an exception escapes `batch()` / `root()`".
// Fixed in runUpdates's catch path: the discarded memo queue is
// flushed (writes before the throw are already committed) and the
// discarded effects are reset to CLEAN so the next write re-queues
// them — previously they were left STALE and unqueued, and
// _markObservers only queues CLEAN observers, so they never ran
// again.

import { test } from '#test'
import { signal, effect, memo, batch, root } from 'pota'

await test('effect recovers after an exception escapes batch()', expect => {
	const s = signal(0)
	const runs = []

	const dispose = root(dispose => {
		effect(() => runs.push(s.read()))
		return dispose
	})

	expect(runs).toEqual([0])

	// the exception escapes batch() to the caller
	expect(() =>
		batch(() => {
			s.write(1)
			throw new Error('boom')
		}),
	).toThrow()

	// the queued run for write(1) was discarded with the batch
	expect(runs).toEqual([0])

	// the effect was reset to CLEAN on the catch path, so later
	// writes re-queue it
	s.write(2)
	expect(runs).toEqual([0, 2])
	s.write(3)
	expect(runs).toEqual([0, 2, 3])

	dispose()
})

await test('effect observing a memo recovers after an exception escapes batch()', expect => {
	const s = signal(0)
	const runs = []

	const dispose = root(dispose => {
		const double = memo(() => s.read() * 2)
		effect(() => runs.push(double()))
		return dispose
	})

	expect(runs).toEqual([0])

	expect(() =>
		batch(() => {
			s.write(1)
			throw new Error('boom')
		}),
	).toThrow()

	// the effect missed the failed batch; the memo was flushed on the
	// catch path, so the next write re-queues the whole chain — a
	// STALE unqueued memo would otherwise stop _markObservers from
	// ever reaching the effect again
	expect(runs).toEqual([0])
	s.write(2)
	expect(runs).toEqual([0, 4])
	s.write(3)
	expect(runs).toEqual([0, 4, 6])

	dispose()
})

await test('memo stays consistent after an exception escapes batch()', expect => {
	const s = signal(0)

	const r = root(dispose => ({
		double: memo(() => s.read() * 2),
		dispose,
	}))

	expect(r.double()).toBe(0)

	expect(() =>
		batch(() => {
			s.write(1)
			throw new Error('boom')
		}),
	).toThrow()

	// the write committed before the throw, and the catch path
	// flushes the discarded memo queue — the memo reflects it
	expect(r.double()).toBe(2)
	s.write(2)
	expect(r.double()).toBe(4)

	r.dispose()
})
