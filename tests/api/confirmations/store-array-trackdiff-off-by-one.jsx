// BUG CONFIRMATION — documentation/improvements.md: "`trackDiff`
// off-by-one drops the `has` write for the first grown index".
// `key > oldLength` should be `>=`: `oldLength` is the previous
// length, so index `oldLength` is the first new key — after
// unshift/splice growth its `in`/`hasOwn` tracking never fires.
// Asserts the CURRENT buggy behavior.

import { test } from '#test'
import { effect, root } from 'pota'
import { mutable } from 'pota/store'

await test('CONFIRM - `in` tracking misses the first index added by unshift', expect => {
	const arr = mutable(['a'])

	let has
	const dispose = root(d => {
		effect(() => {
			has = 1 in arr
		})
		return d
	})
	expect(has).toBe(false)

	arr.unshift('z') // ['z', 'a'] — index 1 now exists

	// BUG: index 1 === oldLength took the modify() branch, which
	// never writes the per-key `has` signal
	expect(has).toBe(false)
	// FIXED: expect(has).toBe(true)
	expect(1 in arr).toBe(true) // the array itself is correct

	dispose()
})

await test('control - indexes past the boundary and push-added indexes track fine', expect => {
	// key > oldLength takes the add() branch and works
	const arr = mutable(['a'])
	let hasTwo
	const dispose = root(d => {
		effect(() => {
			hasTwo = 2 in arr
		})
		return d
	})
	expect(hasTwo).toBe(false)
	arr.unshift('y', 'z') // ['y', 'z', 'a'] — index 2 === oldLength + 1
	expect(hasTwo).toBe(true)
	dispose()

	// push has its own (correct) tracking path
	const arr2 = mutable(['a'])
	let hasOne
	const dispose2 = root(d => {
		effect(() => {
			hasOne = 1 in arr2
		})
		return d
	})
	expect(hasOne).toBe(false)
	arr2.push('b')
	expect(hasOne).toBe(true)
	dispose2()
})
