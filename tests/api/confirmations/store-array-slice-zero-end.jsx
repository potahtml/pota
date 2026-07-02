// BUG CONFIRMATION — documentation/improvements.md: "`slice(x, 0)`
// over-tracks the whole array". The end normalization maps an
// explicit `0` to `target.length`, so a slice that selects nothing
// subscribes to every index. Subscription-only issue (no wrong
// values). Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('CONFIRM - slice(0, 0) subscribes to the whole array', expect => {
	const arr = mutable(['a', 'b', 'c'])

	let runs = 0
	const dispose = root(d => {
		effect(() => {
			arr.slice(0, 0) // selects nothing
			runs++
		})
		return d
	})
	expect(runs).toBe(1)

	// BUG: end === 0 was normalized to target.length, so the effect
	// tracked indexes 0..2 and wakes on an unrelated write
	arr[2] = 'z'
	expect(runs).toBe(2)
	// FIXED: expect(runs).toBe(1)

	dispose()
})

await test('control - a real range only tracks its indexes', expect => {
	const arr = mutable(['a', 'b', 'c'])

	let runs = 0
	const dispose = root(d => {
		effect(() => {
			arr.slice(1, 2)
			runs++
		})
		return d
	})
	expect(runs).toBe(1)

	arr[0] = 'x' // outside the range
	expect(runs).toBe(1)

	arr[1] = 'y' // inside the range
	expect(runs).toBe(2)

	dispose()
})
