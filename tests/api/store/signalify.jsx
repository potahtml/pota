/** @jsxImportSource pota */

// Tests for pota/store `signalify`: reactive property wrapping,
// missing keys, subset tracking, getters/setters, function passthrough,
// and idempotence.
import { test } from '#test'

import { root, syncEffect } from 'pota'
import { signalify } from 'pota/store'

await test('signalify - makes existing properties reactive', expect => {
	const state = signalify({ count: 1 })
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	expect(seen).toEqual([1])

	state.count = 2

	expect(seen).toEqual([1, 2])
})

await test('signalify - can track keys that do not exist yet', expect => {
	const state = signalify({}, ['missing'])
	const seen = []

	root(() => {
		syncEffect(() => {
			seen.push(state.missing)
		})
	})

	expect(seen).toEqual([undefined])

	state.missing = 'now here'

	expect(seen).toEqual([undefined, 'now here'])
})

await test('signalify - does not wrap functions as tracked properties by default', expect => {
	const fn = () => 'value'
	const state = signalify({ fn })

	expect(state.fn).toBe(fn)
	expect(state.fn()).toBe('value')
})

await test('signalify - tracks inherited getter and setter properties', expect => {
	const seen = []
	const source = {
		_count: 1,
		get count() {
			return this._count
		},
		set count(value) {
			this._count = value
		},
	}
	const state = signalify(source)

	root(() => {
		syncEffect(() => {
			seen.push(state.count)
		})
	})

	state.count = 2

	expect(source._count).toBe(2)
	expect(seen).toEqual([1, 2])
})

await test('signalify - tracks multiple properties independently', expect => {
	const state = signalify({ x: 1, y: 2, z: 3 })
	const seenX = []
	const seenY = []

	root(() => {
		syncEffect(() => seenX.push(state.x))
		syncEffect(() => seenY.push(state.y))
	})

	expect(seenX).toEqual([1])
	expect(seenY).toEqual([2])

	state.x = 10
	expect(seenX).toEqual([1, 10])
	expect(seenY).toEqual([2]) // y unchanged

	state.y = 20
	expect(seenX).toEqual([1, 10]) // x unchanged
	expect(seenY).toEqual([2, 20])
})

await test('signalify - tracks only specified keys when subset is provided', expect => {
	const state = signalify({ a: 1, b: 2, c: 3 }, ['a', 'c'])
	const seenA = []
	const seenB = []

	root(() => {
		syncEffect(() => seenA.push(state.a))
		syncEffect(() => seenB.push(state.b))
	})

	expect(seenA).toEqual([1])
	expect(seenB).toEqual([2])

	state.a = 10
	expect(seenA).toEqual([1, 10])

	// b is NOT signalified, so writing to it won't trigger
	state.b = 20
	expect(seenB).toEqual([2])

	state.c = 30 // c IS signalified but no effect reads it
})

await test('signalify - calling signalify twice on same object is safe', expect => {
	const state = signalify({ a: 1 })
	const again = signalify(state)
	const seen = []

	expect(state).toBe(again)

	root(() => {
		syncEffect(() => seen.push(state.a))
	})

	state.a = 2
	expect(seen).toEqual([1, 2])
})
