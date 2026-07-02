// BUG CONFIRMATION — documentation/improvements.md: "`deleteProperty`
// fires deletion tracking for prototype-only keys". The guard uses
// `key in target` (prototype chain included), so deleting a key that
// exists only on the proto "succeeds" without changing anything, yet
// fires `keyWrite(key, false)` + delete signals — spurious wakes and
// a `has` signal that disagrees with reality. Should use `hasOwn`.

import { test } from '#test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('CONFIRM - deleting a proto-only key fires tracking though nothing changed', expect => {
	const obj = mutable(Object.create({ inherited: 'x' }))

	let has
	let runs = 0
	const dispose = root(d => {
		effect(() => {
			has = 'inherited' in obj
			runs++
		})
		return d
	})
	expect(has).toBe(true)
	expect(runs).toBe(1)

	// delete can't remove a prototype property — this is a no-op
	delete obj.inherited
	expect('inherited' in obj).toBe(true)

	// BUG: the delete branch ran anyway and woke the subscriber
	expect(runs).toBe(2)
	// FIXED: expect(runs).toBe(1)

	dispose()
})

await test('control - deleting an own key tracks correctly', expect => {
	const obj = mutable({ k: 1 })

	let has
	let runs = 0
	const dispose = root(d => {
		effect(() => {
			has = 'k' in obj
			runs++
		})
		return d
	})
	expect(has).toBe(true)
	expect(runs).toBe(1)

	delete obj.k
	expect(has).toBe(false)
	expect(runs).toBe(2)

	dispose()
})
