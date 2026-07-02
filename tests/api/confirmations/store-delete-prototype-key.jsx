// REGRESSION — documentation/improvements.md: "`deleteProperty` fires
// deletion tracking for prototype-only keys". The guard used
// `key in target` (prototype chain included), so deleting a key that
// exists only on the proto — a JS no-op — fired `keyWrite(key,
// false)` + delete signals: spurious wakes and a `has` signal that
// disagreed with reality. Fixed with `hasOwn`.

import { test } from '#test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('deleting a proto-only key is a tracking no-op', expect => {
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

	// nothing changed, so the subscriber must not wake — and the
	// `has` signal keeps agreeing with `in`
	expect(runs).toBe(1)
	expect(has).toBe(true)

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

await test('deleting an own key that shadows a proto key updates has', expect => {
	const proto = { k: 'proto' }
	const obj = mutable(Object.assign(Object.create(proto), { k: 'own' }))

	let has
	const dispose = root(d => {
		effect(() => {
			has = 'k' in obj
		})
		return d
	})
	expect(has).toBe(true)

	// removes the own key; the proto key still answers `in`
	delete obj.k
	expect('k' in obj).toBe(true)
	expect(obj.k).toBe('proto')

	dispose()
})
