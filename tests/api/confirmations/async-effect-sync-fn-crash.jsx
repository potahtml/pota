// BUG CONFIRMATION — documentation/improvements.md: "`asyncEffect`
// crashes when `fn` returns a non-promise". `resolved(fn(…), onDone)`
// calls `.then` on the return value, so a sync fn (returning
// undefined) throws inside the effect. Asserts the CURRENT buggy
// behavior (error routed to the boundary).

import { test, macrotask } from '#test'
import { asyncEffect, catchError, root } from 'pota'

await test('CONFIRM - asyncEffect with a sync fn throws', expect => {
	const caught = []
	const ran = []

	const dispose = /** @type {() => void} */ (
		catchError(
			() =>
				root(d => {
					asyncEffect(() => {
						ran.push('ran')
						// returns undefined — not a promise
					})
					return d
				}),
			err => caught.push(err instanceof Error ? err.message : String(err)),
		)
	)

	// the body ran, then resolved(undefined, …) blew up
	expect(ran).toEqual(['ran'])

	// BUG: undefined.then — TypeError routed to the boundary
	expect(caught.length).toBe(1)
	expect(caught[0]).toInclude('then')
	// FIXED: expect(caught).toEqual([])

	dispose()
})

await test('control - asyncEffect with an async fn works', async expect => {
	const order = []

	const dispose = root(d => {
		asyncEffect(async () => {
			order.push('run')
		})
		return d
	})

	await macrotask()
	expect(order).toEqual(['run'])

	dispose()
})
