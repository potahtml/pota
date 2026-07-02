// REGRESSION — documentation/improvements.md: "`await derived` hangs
// forever on rejection". `Derived.then` used to ignore its `reject`
// argument and `thenCallbacks` were only drained on successful
// commit. Fixed: a rejected promise (or a throwing fn) settles
// awaiting consumers with the rejection, keeps routing the error to
// the boundary, and rejects late awaiters until a newer attempt
// starts.

import { test, macrotask } from '#test'
import { derived, catchError, root } from 'pota'

await test('then() rejects when the derived promise rejects', async expect => {
	const settled = []
	const caught = []

	const dispose = root(dispose => {
		catchError(
			() => {
				const d = derived(() => Promise.reject(new Error('nope')))
				d.then(
					() => settled.push('resolved'),
					err => settled.push(err.message),
				)
			},
			err =>
				caught.push(err instanceof Error ? err.message : String(err)),
		)
		return dispose
	})

	await macrotask()

	// the rejection still routes to the error boundary
	expect(caught).toEqual(['nope'])

	// and awaiting consumers settle with the rejection
	expect(settled).toEqual(['nope'])

	dispose()
})

await test('await derived throws instead of hanging', async expect => {
	const caught = []

	let d
	const dispose = root(dispose => {
		catchError(
			() => {
				d = derived(() => Promise.reject(new Error('boom')))
			},
			() => caught.push('routed'),
		)
		return dispose
	})

	let thrown
	try {
		await d
	} catch (err) {
		thrown = err instanceof Error ? err.message : String(err)
	}
	expect(thrown).toBe('boom')

	// a late awaiter also settles (the failed attempt is remembered
	// until a newer attempt starts)
	thrown = undefined
	try {
		await d
	} catch (err) {
		thrown = err instanceof Error ? err.message : String(err)
	}
	expect(thrown).toBe('boom')

	dispose()
})

await test('await derived throws when fn throws synchronously', async expect => {
	let d
	const dispose = root(dispose => {
		catchError(
			() => {
				d = derived(() => {
					throw new Error('sync')
				})
			},
			() => {},
		)
		return dispose
	})

	let thrown
	try {
		await d
	} catch (err) {
		thrown = err instanceof Error ? err.message : String(err)
	}
	expect(thrown).toBe('sync')

	dispose()
})

await test('a rejected derived recovers on a direct write', async expect => {
	/** @type {Derived<number> | undefined} */
	let d
	const dispose = root(dispose => {
		catchError(
			() => {
				d = derived(
					() =>
						/** @type {Promise<number>} */ (
							Promise.reject(new Error('first'))
						),
				)
			},
			() => {},
		)
		return dispose
	})

	let thrown
	try {
		await d
	} catch (err) {
		thrown = err instanceof Error ? err.message : String(err)
	}
	expect(thrown).toBe('first')

	// a new write starts a fresh attempt; awaiters resolve again
	// (await yields the unwrapped callable — call it to read)
	const dd = /** @type {NonNullable<typeof d>} */ (d)
	dd(42)
	expect((await dd)()).toBe(42)

	dispose()
})

await test('control - then() fires when the derived promise resolves', async expect => {
	let value

	const dispose = root(dispose => {
		const d = derived(() => Promise.resolve(42))
		d.then(v => (value = v()))
		return dispose
	})

	await macrotask()

	expect(value).toBe(42)

	dispose()
})
