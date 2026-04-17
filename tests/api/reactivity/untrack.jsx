// Tests for `untrack()` — avoids subscribing to incidental reads,
// returns the callback value.

import { test } from '#test'
import { signal, untrack, effect, memo, cleanup, root } from 'pota'

await test('untrack - avoids subscribing to incidental reads', expect => {
	const tracked = signal(1)
	const incidental = signal(10)
	const seen = []

	root(() => {
		effect(() => {
			seen.push({
				tracked: tracked.read(),
				incidental: untrack(() => incidental.read()),
			})
		})
	})

	incidental.write(20)
	expect(seen).toEqual([{ tracked: 1, incidental: 10 }])

	tracked.write(2)
	expect(seen).toEqual([
		{ tracked: 1, incidental: 10 },
		{ tracked: 2, incidental: 20 },
	])
})

// --- untrack returns the callback value --------------------------

await test('untrack - returns the value of the callback', expect => {
	const s = signal(42)

	const result = untrack(() => s.read() + 1)

	expect(result).toBe(43)
})

// --- untrack outside any tracking scope just calls fn ----------------

await test('untrack - outside any reactive scope just runs the callback', expect => {
	// No active Listener — early return path: `return fn()`.
	expect(untrack(() => 7)).toBe(7)
	expect(untrack(() => 'x')).toBe('x')

	let ran = 0
	untrack(() => {
		ran++
	})
	expect(ran).toBe(1)
})

// --- untrack keeps Owner — cleanups still register -------------------

await test('untrack - cleanups registered inside untrack still attach to the owner', expect => {
	const seen = []

	const dispose = root(d => {
		effect(() => {
			untrack(() => {
				// Owner is preserved across untrack, so cleanup binds to
				// the enclosing effect and fires on re-run / disposal.
				cleanup(() => seen.push('cleaned'))
			})
		})
		return d
	})

	expect(seen).toEqual([])

	dispose()
	expect(seen).toEqual(['cleaned'])
})

// --- untrack inside memo does not create subscriptions ---------------

await test('untrack - inside memo, reads do not register as sources', expect => {
	const tracked = signal(0)
	const incidental = signal(100)
	let runs = 0

	root(() => {
		const m = memo(() => {
			runs++
			return tracked.read() + untrack(() => incidental.read())
		})
		expect(m()).toBe(100)
	})

	const baseline = runs
	incidental.write(200) // should NOT cause memo re-eval
	expect(runs).toBe(baseline)

	tracked.write(5) // should cause memo re-eval
	// memo is lazy; read it to force the re-eval
	root(() => {
		const again = memo(() => tracked.read() + untrack(() => incidental.read()))
		expect(again()).toBe(205)
	})
})

// --- nested untrack is a no-op at the inner level -------------------

await test('untrack - nested untrack behaves the same as a single one', expect => {
	const s = signal(1)
	const outer = signal(10)
	const seen = []

	root(() => {
		effect(() => {
			seen.push(outer.read())
			untrack(() => {
				untrack(() => s.read())
			})
		})
	})

	expect(seen).toEqual([10])

	// writing s should not re-trigger — both untracks suppress tracking
	s.write(999)
	expect(seen).toEqual([10])

	outer.write(20)
	expect(seen).toEqual([10, 20])
})

// --- untrack that throws propagates and restores tracking state ------

await test('untrack - thrown error propagates and outer tracking is restored', expect => {
	const tracked = signal(1)
	const seen = []

	root(() => {
		effect(() => {
			seen.push(tracked.read())

			try {
				untrack(() => {
					throw new Error('inside untrack')
				})
			} catch (err) {
				// swallowed here; the surrounding effect continues
			}
		})
	})

	expect(seen).toEqual([1])

	// After the throw, the effect should still be tracking `tracked`
	tracked.write(2)
	expect(seen).toEqual([1, 2])
})
