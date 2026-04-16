// Tests for `root()` — explicit owner scope, return value passthrough,
// nested-root independent disposal.

import { test } from '#test'
import { cleanup, effect, root, signal } from 'pota'

await test('root and cleanup - dispose owner scopes explicitly', expect => {
	const cleaned = []

	const dispose = root(dispose => {
		cleanup(() => cleaned.push('root'))
		return dispose
	})

	expect(cleaned).toEqual([])

	dispose()

	expect(cleaned).toEqual(['root'])
})

// --- root returns value ------------------------------------------------------

await test('root - returns the value from the callback', expect => {
	const result = root(() => 42)
	expect(result).toBe(42)
})

// --- root inside root: inner disposes independently --------------------------

await test('root - nested roots dispose independently', expect => {
	const seen = []

	const disposeOuter = root(d => {
		cleanup(() => seen.push('outer'))

		const disposeInner = root(d2 => {
			cleanup(() => seen.push('inner'))
			return d2
		})

		disposeInner()
		expect(seen).toEqual(['inner'])

		return d
	})

	disposeOuter()
	expect(seen).toEqual(['inner', 'outer'])
})

await test('root - nested scopes dispose children before parents (3 levels)', expect => {
	const order = []

	const dispose = root(d => {
		cleanup(() => order.push('parent'))
		root(d2 => {
			cleanup(() => order.push('child'))
			root(d3 => {
				cleanup(() => order.push('grandchild'))
				d3()
			})
			d2()
		})
		return d
	})

	expect(order).toEqual(['grandchild', 'child'])

	dispose()

	expect(order).toEqual(['grandchild', 'child', 'parent'])
})

await test('root — throw without handler goes to console.error', expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	root(() => {
		throw new Error('root unhandled')
	})

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('root unhandled')
	console.error = original
})

await test('root - multiple roots sharing a signal react independently', expect => {
	const shared = signal(0)
	const seenA = []
	const seenB = []

	const disposeA = root(d => {
		effect(() => seenA.push(shared.read()))
		return d
	})
	const disposeB = root(d => {
		effect(() => seenB.push(shared.read()))
		return d
	})

	expect(seenA).toEqual([0])
	expect(seenB).toEqual([0])

	shared.write(1)
	expect(seenA).toEqual([0, 1])
	expect(seenB).toEqual([0, 1])

	disposeA()

	shared.write(2)
	expect(seenA).toEqual([0, 1]) // disposed, no more updates
	expect(seenB).toEqual([0, 1, 2])

	disposeB()
})
