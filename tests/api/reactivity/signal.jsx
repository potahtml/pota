// Tests for `signal()` — read/write/update tuple, custom equals,
// undefined initial value, NaN handling, object reference equality.

import { test } from '#test'
import { signal, syncEffect, root } from 'pota'

await test('signal - supports read, write and update', expect => {
	const count = signal(1)

	expect(count.read()).toBe(1)
	expect(count[0]()).toBe(1)
	expect(count.write(2)).toBe(true)
	expect(count.read()).toBe(2)
	expect(count.update(value => value + 3)).toBe(true)
	expect(count.read()).toBe(5)
	expect(count.write(5)).toBe(false)
})

// --- signal options -----------------------------------------------------------

await test('signal - equals:false always notifies even when value is the same', expect => {
	const count = signal(1, { equals: false })
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1])

	// same value, but equals:false means it still triggers
	count.write(1)
	expect(seen).toEqual([1, 1])

	count.write(1)
	expect(seen).toEqual([1, 1, 1])
})

await test('signal - write returns false when value is equal (default equality)', expect => {
	const count = signal(1)
	expect(count.write(1)).toBe(false)
	expect(count.write(2)).toBe(true)
	expect(count.write(2)).toBe(false)
})

await test('signal - initial undefined value works', expect => {
	const s = signal()
	expect(s.read()).toBe(undefined)
	s.write('set')
	expect(s.read()).toBe('set')
})

// --- signal custom equals ----------------------------------------------------

await test('signal - custom equals comparator controls notification', expect => {
	// only notify when integer part changes
	const count = signal(1.1, {
		equals: (a, b) => Math.floor(a) === Math.floor(b),
	})
	const seen = []

	root(() => {
		syncEffect(() => seen.push(count.read()))
	})

	expect(seen).toEqual([1.1])

	count.write(1.9) // same floor → suppressed
	expect(seen).toEqual([1.1])

	count.write(2.0) // different floor → notifies
	expect(seen).toEqual([1.1, 2.0])
})

// --- signal update method ----------------------------------------------------

await test('signal - update receives the previous value and returns new', expect => {
	const count = signal(10)
	const changed = count.update(prev => prev + 5)

	expect(changed).toBe(true)
	expect(count.read()).toBe(15)

	const same = count.update(prev => prev)
	expect(same).toBe(false)
})

// --- signal with object value and reference equality -------------------------

await test('signal - object values: same ref suppressed, different ref notifies', expect => {
	const obj = { count: 1 }
	const s = signal(obj)
	const seen = []

	root(() => {
		syncEffect(() => seen.push(s.read()))
	})

	expect(seen).toEqual([obj])

	// same reference → no notification
	s.write(obj)
	expect(seen).toEqual([obj])

	// different reference → notification even if deep-equal
	const obj2 = { count: 1 }
	s.write(obj2)
	expect(seen).toEqual([obj, obj2])
})

// --- signal - NaN equality (Object.is treats NaN as equal) ---------------

await test('signal - writing NaN twice does not re-notify when equals is Object.is', expect => {
	// pota's default equality is strict === , so NaN !== NaN and a
	// second NaN write would re-trigger. Opt into Object.is via the
	// equals option to get the de-duping behavior.
	const n = signal(/** @type {number} */ (0), { equals: Object.is })
	const seen = []

	root(() => {
		syncEffect(() => seen.push(n.read()))
	})

	n.write(NaN)
	expect(seen.length).toBe(2)

	n.write(NaN)
	// Object.is(NaN, NaN) is true, so no re-trigger
	expect(seen.length).toBe(2)
})
