// Tests for `batch()` — coalesces effects, multiple writes to the
// same signal, nested batches, return value passthrough.

import { test } from '#test'
import { signal, batch, effect, memo, syncEffect, root } from 'pota'

await test('batch - coalesces dependent effect work', expect => {
	const left = signal(1)
	const right = signal(2)
	const seen = []

	root(() => {
		effect(() => seen.push(left.read() + right.read()))
	})

	expect(seen).toEqual([3])

	batch(() => {
		left.write(3)
		right.write(4)
	})

	expect(seen).toEqual([3, 7])
})

await test('batch - multiple writes to the same signal inside a batch coalesce', expect => {
	// The basic batch test above writes each signal exactly once. This
	// test exercises the narrower case of writing the same signal several
	// times inside one batch — the effect should still re-run exactly
	// once and see the final value of each signal, without double
	// notifications from the intermediate writes.
	const a = signal(0)
	const b = signal(0)
	let runs = 0

	root(() => {
		syncEffect(() => {
			runs++
			a.read()
			b.read()
		})
	})

	expect(runs).toBe(1)

	batch(() => {
		a.write(1)
		a.write(2)
		b.write(3)
		b.write(4)
	})

	expect(runs).toBe(2)
	expect(a.read()).toBe(2)
	expect(b.read()).toBe(4)
})

// --- nested batch -------------------------------------------------------------

await test('batch - nested batches defer until outermost completes', expect => {
	const a = signal(1)
	const b = signal(2)
	const c = signal(3)
	const seen = []

	root(() => {
		effect(() => seen.push(a.read() + b.read() + c.read()))
	})

	expect(seen).toEqual([6])

	batch(() => {
		a.write(10)
		batch(() => {
			b.write(20)
			c.write(30)
		})
		// inner batch should not have flushed yet
	})

	// all three updates coalesced into one effect run
	expect(seen).toEqual([6, 60])
})

// --- batch returns the callback result ----------------------------

await test('batch - returns the callback return value', expect => {
	const result = batch(() => 'batched')

	expect(result).toBe('batched')
})

// --- batch prevents extra evaluation during reset -------------------

await test('batch - unbatched reset pattern causes extra memo evaluation', expect => {
	const [flag, setFlag] = signal(true)
	const [counter, , updateCounter] = signal(0)

	let outerRuns = 0

	root(dispose => {
		const inner = memo(() => 'content-' + counter())

		const outer = memo(() => {
			outerRuns++
			if (flag()) return 'fallback'
			return inner()
		})

		expect(outer()).toBe('fallback')
		expect(outerRuns).toBe(1)

		// two writes WITHOUT batch: outer evaluates twice
		setFlag(false)
		updateCounter(n => n + 1)
		expect(outer()).toBe('content-1')
		expect(outerRuns).toBe(3)

		dispose()
	})
})

await test('batch - batched reset pattern avoids extra memo evaluation', expect => {
	const [flag, setFlag] = signal(true)
	const [counter, , updateCounter] = signal(0)

	let outerRuns = 0

	root(dispose => {
		const inner = memo(() => 'content-' + counter())

		const outer = memo(() => {
			outerRuns++
			if (flag()) return 'fallback'
			return inner()
		})

		expect(outer()).toBe('fallback')
		outerRuns = 0

		// same two writes WITH batch: outer evaluates once
		batch(() => {
			setFlag(false)
			updateCounter(n => n + 1)
		})
		expect(outer()).toBe('content-1')
		expect(outerRuns).toBe(1)

		dispose()
	})
})
