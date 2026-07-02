// REGRESSION — documentation/improvements.md: "`withValue` array
// mutates the caller's array in place". `value[i] = item` used to
// replace the user's functions/promises with resolved snapshots, so a
// reused array arrived at the next consumer pre-resolved and inert.
// Fixed by resolving items into a copy; the caller's array is never
// touched.

import { test } from '#test'
import { signal, withValue, root } from 'pota'

await test('the input array items are left untouched', expect => {
	const s = signal('a')
	const arr = ['static', s.read]

	const dispose = root(dispose => {
		withValue(arr, () => {})
		return dispose
	})

	// the reactive function stays in the caller's array
	expect(arr[1]).toBe(s.read)

	s.write('b')
	expect(arr[1]).toBe(s.read)

	dispose()
})

await test('a reused array stays reactive for every consumer', expect => {
	const s = signal('one')
	const shared = [s.read]
	const first = []
	const second = []

	const dispose = root(dispose => {
		withValue(shared, v => first.push(v[0]))
		withValue(shared, v => second.push(v[0]))
		return dispose
	})

	expect(first).toEqual(['one'])
	expect(second).toEqual(['one'])

	// both consumers track the signal through the shared array
	s.write('two')
	expect(first).toEqual(['one', 'two'])
	expect(second).toEqual(['one', 'two'])

	dispose()
})
