// BUG CONFIRMATION — documentation/improvements.md: "Projections
// can't delete". Projection has no deleteProperty trap: delete
// removes from the copy-on-write target, but has/get/ownKeys keep
// projecting the source, so the key resurrects immediately. Needs a
// tombstone or an explicit trap. Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { project } from 'pota/store'

await test('CONFIRM - deleting a projected key resurrects it from the source', expect => {
	const source = { a: 1, b: 2 }
	const proj = project(source)

	expect(proj.a).toBe(1)

	delete proj.a

	// BUG: the key is still there, still projecting the source
	expect('a' in proj).toBe(true)
	expect(proj.a).toBe(1)
	// FIXED: expect('a' in proj).toBe(false) and proj.a === undefined

	// the source must stay intact either way (copy-on-write contract)
	expect(source.a).toBe(1)
})

await test('CONFIRM - deleting an overridden key falls back to the source value', expect => {
	const source = { b: 2 }
	const proj = project(source)

	proj.b = 99
	expect(proj.b).toBe(99)
	expect(source.b).toBe(2)

	delete proj.b

	// Deleting the override reverts to projecting the source — there
	// is no way to make a key absent on a projection. If revert is
	// the intended CoW semantics, document it; absence needs a
	// tombstone either way.
	expect(proj.b).toBe(2)
	expect('b' in proj).toBe(true)
})
