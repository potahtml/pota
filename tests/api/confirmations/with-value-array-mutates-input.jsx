// BUG CONFIRMATION — documentation/improvements.md: "`withValue`
// array mutates the caller's array in place". `value[i] = item`
// replaces the user's functions/promises with resolved snapshots, so
// a reused array arrives at the next consumer pre-resolved and inert.
// Asserts the CURRENT buggy behavior; flip FIXED assertions on fix.

import { test } from '#test'
import { signal, withValue, root } from 'pota'

await test('CONFIRM - the input array items are replaced with resolved values', expect => {
	const s = signal('a')
	const arr = ['static', s.read]

	const dispose = root(dispose => {
		withValue(arr, () => {})
		return dispose
	})

	// BUG: the reactive function was overwritten with its snapshot
	expect(arr[1]).toBe('a')
	// FIXED: expect(arr[1]).toBe(s.read)

	// the item effect is still alive: it keeps writing snapshots into
	// the caller's array on every signal change
	s.write('b')
	expect(arr[1]).toBe('b')
	// FIXED: expect(arr[1]).toBe(s.read)

	dispose()
})

await test('CONFIRM - a reused array is inert for the second consumer', expect => {
	const s = signal('one')
	const shared = [s.read]
	const first = []
	const second = []

	const dispose = root(dispose => {
		withValue(shared, v => first.push(v[0]))
		// second consumer receives the mutated array: a plain snapshot
		// value instead of the reactive function
		withValue(shared, v => second.push(v[0]))
		return dispose
	})

	expect(first).toEqual(['one'])
	expect(second).toEqual(['one'])

	// BUG: neither consumer tracks the signal through the shared
	// array anymore (first: pending bug; second: function was gone)
	s.write('two')
	expect(second).toEqual(['one'])
	// FIXED: expect(second).toEqual(['one', 'two'])

	dispose()
})
