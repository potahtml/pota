// Tests for `untrack()` — avoids subscribing to incidental reads,
// returns the callback value.

import { test } from '#test'
import { signal, untrack, effect, root } from 'pota'

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
