// BUG CONFIRMATION — documentation/improvements.md: "`await derived`
// hangs forever on rejection". `Derived.then` ignores its `reject`
// argument and `thenCallbacks` are only drained on successful commit,
// so a rejected promise routes to the error handler but awaiting
// consumers never settle. Asserts the CURRENT buggy behavior.

import { test, macrotask } from '#test'
import { derived, catchError, root } from 'pota'

await test('CONFIRM - then() never settles when the derived promise rejects', async expect => {
	const settled = []
	const caught = []

	const dispose = root(dispose => {
		catchError(
			() => {
				const d = derived(() => Promise.reject(new Error('nope')))
				d.then(() => settled.push('resolved'))
			},
			err => caught.push(err instanceof Error ? err.message : String(err)),
		)
		return dispose
	})

	await macrotask()

	// the rejection was routed to the error boundary
	expect(caught).toEqual(['nope'])

	// BUG: the then() callback is queued forever — `await d` hangs
	expect(settled).toEqual([])
	// FIXED: awaiters should settle (reject) instead of hanging

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
