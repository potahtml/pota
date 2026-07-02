// BUG CONFIRMATION — documentation/improvements.md:
// "`externalSignal.write` matches id-less items with each other".
// `stale.find(before => before.id === after.id)` pairs any two items
// whose id is undefined — every id-less fresh item is compared
// against the FIRST id-less stale item, so reference reuse pairs the
// wrong objects. Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { externalSignal } from 'pota'

await test('CONFIRM - id-less items all match the first id-less stale item', expect => {
	const a = { name: 'x' }
	const b = { name: 'y' }
	const ext = externalSignal([a, b])

	// same logical content, reordered — with ids both references
	// would be kept
	ext.write([{ name: 'y' }, { name: 'x' }])
	const result = ext.read()

	// fresh {name:'x'} was compared against `a` (first id-less stale
	// item), deep-equal, so `a`'s reference was kept
	expect(result[1]).toBe(a)

	// BUG: fresh {name:'y'} was ALSO compared against `a`, not `b` —
	// not equal, so the reference to `b` was lost
	expect(result[0]).not.toBe(b)
	expect(result[0]).toEqual({ name: 'y' })
	// FIXED: expect(result[0]).toBe(b)
})

await test('control - items with ids keep their references across writes', expect => {
	const p1 = { id: 1, n: 'a' }
	const p2 = { id: 2, n: 'b' }
	const ext = externalSignal([p1, p2])

	ext.write([
		{ id: 2, n: 'b' },
		{ id: 1, n: 'a' },
	])
	const result = ext.read()

	expect(result[0]).toBe(p2)
	expect(result[1]).toBe(p1)
})
