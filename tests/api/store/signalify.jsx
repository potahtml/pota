/** @jsxImportSource pota */

// Tests for pota/store `signalify`: reactive property wrapping,
// missing keys, subset tracking, getters/setters, function passthrough,
// key blacklist, non-configurable descriptors, class prototypes,
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

// --- returns the same reference (mutates in place) -------------------------

await test('signalify - returns the same object reference', expect => {
	const source = { a: 1 }
	const result = signalify(source)

	expect(result).toBe(source)
})

// --- key blacklist ---------------------------------------------------------

await test('signalify - skips the constructor key', expect => {
	// constructor exists on the prototype of every plain object; it
	// must not be signalified or track reads.
	const state = signalify({ a: 1 })
	const seen = []

	root(() => {
		syncEffect(() => seen.push(state.constructor))
	})

	expect(seen.length).toBe(1)
	// constructor is the plain Object constructor and was not replaced
	expect(state.constructor).toBe(Object)
})

await test('signalify - skips Symbol keys', expect => {
	// well-known symbols like Symbol.iterator are on the blacklist so
	// signalify must leave them untouched.
	const sourceIter = function* () {
		yield 1
	}
	const source = {
		[Symbol.iterator]: sourceIter,
		a: 1,
	}
	signalify(source)

	expect(source[Symbol.iterator]).toBe(sourceIter)
})

// --- mixed subset + missing key --------------------------------------------

await test('signalify - subset with mix of existing and missing keys', expect => {
	const state = signalify({ a: 1 }, ['a', 'b'])
	const seenA = []
	const seenB = []

	root(() => {
		syncEffect(() => seenA.push(state.a))
		syncEffect(() => seenB.push(state.b))
	})

	expect(seenA).toEqual([1])
	expect(seenB).toEqual([undefined])

	state.a = 10
	state.b = 20

	expect(seenA).toEqual([1, 10])
	expect(seenB).toEqual([undefined, 20])
})

// --- non-extensible targets ------------------------------------------------

await test('signalify - non-extensible object does not gain new tracked keys', expect => {
	const frozen = Object.preventExtensions({ a: 1 })

	// Does not throw when asked to add a key to a non-extensible object.
	expect(() => signalify(frozen, ['b'])).not.toThrow()

	// The new key is still not added (object is non-extensible).
	expect('b' in frozen).toBe(false)
})

// --- getter-only props -----------------------------------------------------

await test('signalify - getter-only property stays readable and read-only', expect => {
	let hit = 0
	const source = {
		get pi() {
			hit++
			return 3.14
		},
	}

	signalify(source)

	const seen = []
	root(() => {
		syncEffect(() => seen.push(source.pi))
	})

	expect(seen).toEqual([3.14])
	// In strict mode, assigning to a getter-only property throws.
	expect(() => {
		/** @type {any} */ (source).pi = 1
	}).toThrow()
})

// --- class instances / prototype chain -------------------------------------

await test('signalify - tracks getters/setters defined on a class prototype', expect => {
	class Counter {
		constructor() {
			this._count = 1
		}
		get count() {
			return this._count
		}
		set count(v) {
			this._count = v
		}
	}

	const instance = new Counter()
	signalify(instance)

	const seen = []
	root(() => {
		syncEffect(() => seen.push(instance.count))
	})

	expect(seen).toEqual([1])

	instance.count = 5
	expect(seen).toEqual([1, 5])
})

// --- non-tracked key is passthrough ----------------------------------------

await test('signalify - keys outside the subset are not tracked', expect => {
	const state = signalify({ a: 1, b: 2 }, ['a'])
	const seen = []

	root(() => {
		syncEffect(() => seen.push(state.b))
	})

	expect(seen).toEqual([2])

	// writing to b still works as a plain assignment
	state.b = 99
	expect(state.b).toBe(99)
	// but the effect does not re-run
	expect(seen).toEqual([2])
})

// --- writing same value is a no-op for effects -----------------------------

await test('signalify - writing the same value does not re-run effects', expect => {
	const state = signalify({ count: 1 })
	const seen = []

	root(() => {
		syncEffect(() => seen.push(state.count))
	})

	expect(seen).toEqual([1])

	state.count = 1
	state.count = 1

	expect(seen).toEqual([1])
})

// --- objects with null prototype -------------------------------------------

await test('signalify - Object.create(null) is signalified', expect => {
	const source = Object.create(null)
	source.a = 1
	signalify(source)

	const seen = []
	root(() => {
		syncEffect(() => seen.push(source.a))
	})

	expect(seen).toEqual([1])

	source.a = 2
	expect(seen).toEqual([1, 2])
})
