// REGRESSION — documentation/improvements.md: "`slice(x, 0)`
// over-tracks the whole array". The end normalization used to map an
// explicit `0` to `target.length`, so a slice that selects nothing
// subscribed to every index. Fixed: the normalization dispatches on
// undefined-ness, not truthiness.

import { test } from '#test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('slice(0, 0) does not subscribe to the whole array', expect => {
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

	// nothing was selected, so an unrelated write must not wake it
	arr[2] = 'z'
	expect(runs).toBe(1)

	dispose()
})

await test('slice() with no end still tracks the whole array', expect => {
	const arr = mutable(['a', 'b', 'c'])

	let runs = 0
	const dispose = root(d => {
		effect(() => {
			arr.slice(1)
			runs++
		})
		return d
	})
	expect(runs).toBe(1)

	arr[2] = 'z' // inside the implicit range
	expect(runs).toBe(2)

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
