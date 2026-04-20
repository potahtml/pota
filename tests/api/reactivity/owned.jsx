// Tests for `owned()` — owner-scoped callbacks with onCancel on
// disposal, reusable callback functions. Also includes addEvent's
// auto-cleanup test, which exercises the same owner-disposal pattern.

import { test } from '#test'
import { addEvent, owned, root } from 'pota'

await test('owned - runs callback when owner is still alive', expect => {
	const seen = []

	const fn = root(() => owned(value => seen.push(value)))

	fn('a')
	fn('b')

	expect(seen).toEqual(['a', 'b'])
})

await test('owned - calls onCancel when owner is disposed without calling the owned fn', expect => {
	const seen = []

	const dispose = root(d => {
		owned(
			() => seen.push('ran'),
			() => seen.push('cancelled'),
		)
		return d
	})

	dispose()

	expect(seen).toEqual(['cancelled'])
})

await test('owned - calling the owned fn before disposal suppresses onCancel', expect => {
	const seen = []

	/** @type {ReturnType<typeof owned>} */
	let fn
	const dispose = root(d => {
		fn = owned(
			() => seen.push('ran'),
			() => seen.push('cancelled'),
		)
		return d
	})

	fn()
	dispose()

	expect(seen).toEqual(['ran'])
})

await test('owned - does not run callback after owner is disposed', expect => {
	const seen = []

	/** @type {ReturnType<typeof owned>} */
	let fn
	const dispose = root(d => {
		fn = owned(value => seen.push(value))
		return d
	})

	fn('before')
	dispose()
	fn('after')

	expect(seen).toEqual(['before'])
})

// --- owned reusable ----------------------------------------------------------

await test('owned - returned function can be called multiple times while owner is alive', expect => {
	const seen = []

	const fn = root(() =>
		owned(v => {
			seen.push(v)
			return v
		}),
	)

	fn('a')
	fn('b')
	fn('c')

	expect(seen).toEqual(['a', 'b', 'c'])
})

// --- addEvent auto-cleanup ---------------------------------------------------

await test('owned — error without handler goes to console.error', expect => {
	const original = console.error
	/** @type {any} */ let logged
	console.error = err => {
		logged = err
	}

	/** @type {any} */ let ownedFn
	root(() => {
		ownedFn = owned(() => {
			throw new Error('owned unhandled')
		})
	})
	ownedFn()

	expect(logged instanceof Error).toBe(true)
	expect(logged.message).toBe('owned unhandled')
	console.error = original
})

await test('addEvent - auto-removes listener when owner scope disposes', expect => {
	const button = document.createElement('button')
	const seen = []

	// baseline: no clicks yet
	expect(seen).toEqual([])

	const dispose = root(d => {
		addEvent(button, 'click', () => seen.push('click'))
		return d
	})

	// handler works
	button.click()
	expect(seen).toEqual(['click'])

	dispose()

	// handler cleaned up — click does nothing
	button.click()
	expect(seen).toEqual(['click'])
})
