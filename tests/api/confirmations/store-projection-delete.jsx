// REGRESSION — documentation/improvements.md: "Projections can't
// delete". Projection had no deleteProperty trap: delete removed from
// the copy-on-write target, but has/get/ownKeys kept projecting the
// source, so the key resurrected immediately. Fixed with lazy
// tombstones: delete makes the key absent on the projection (source
// untouched); a later set of the key resurrects it.

import { test } from '#test'
import { effect, root } from 'pota'
import { project } from 'pota/store'

await test('deleting a projected key makes it absent, source intact', expect => {
	const source = { a: 1, b: 2 }
	const proj = project(source)

	expect(proj.a).toBe(1)

	delete proj.a

	expect('a' in proj).toBe(false)
	expect(proj.a).toBe(undefined)
	expect(Object.keys(proj)).toEqual(['b'])

	// the source stays intact (copy-on-write contract)
	expect(source.a).toBe(1)
})

await test('deleting an overridden key makes it absent too', expect => {
	const source = { b: 2 }
	const proj = project(source)

	proj.b = 99
	expect(proj.b).toBe(99)
	expect(source.b).toBe(2)

	delete proj.b

	// absence, not revert-to-source — the tombstone blocks projection
	expect('b' in proj).toBe(false)
	expect(proj.b).toBe(undefined)
	expect(source.b).toBe(2)
})

await test('setting a deleted key resurrects it', expect => {
	const source = { a: 1 }
	const proj = project(source)

	delete proj.a
	expect('a' in proj).toBe(false)

	proj.a = 5
	expect('a' in proj).toBe(true)
	expect(proj.a).toBe(5)
	expect(source.a).toBe(1)
})

await test('deletion is reactive through the mutable wrapper', expect => {
	const source = { a: 1 }
	const proj = project(source)

	let has
	const dispose = root(d => {
		effect(() => {
			has = 'a' in proj
		})
		return d
	})
	expect(has).toBe(true)

	delete proj.a
	expect(has).toBe(false)

	proj.a = 2
	expect(has).toBe(true)

	dispose()
})

await test('tombstones are per projection', expect => {
	const source = { a: 1 }
	const projA = project(source)
	const projB = project(source)

	delete projA.a

	expect('a' in projA).toBe(false)
	expect('a' in projB).toBe(true)
	expect(projB.a).toBe(1)
})
