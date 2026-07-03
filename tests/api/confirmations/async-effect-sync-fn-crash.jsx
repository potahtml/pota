// REGRESSION — documentation/improvements.md: "`asyncEffect` crashes
// when `fn` returns a non-promise". `resolved(fn(…), onDone)` called
// `.then` on the return value, so a sync fn (returning undefined)
// threw inside the effect. Fixed: non-thenable returns complete the
// run synchronously (`onDone()` right away) — `resolved` keeps its
// promise-only contract.

import { test, macrotask } from '#test'
import { asyncEffect, catchError, root, signal } from 'pota'

await test('asyncEffect with a sync fn does not throw', expect => {
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

	expect(ran).toEqual(['ran'])
	expect(caught).toEqual([])

	dispose()
})

await test('sync runs complete immediately — re-runs never wait on a previous run', expect => {
	const s = signal(0)
	const prevs = []

	const dispose = root(d => {
		asyncEffect(prev => {
			s.read()
			prevs.push(prev)
		})
		return d
	})

	s.write(1)
	s.write(2)

	// each sync run resolved its queue entry on the spot, so every
	// run saw an empty queue and received no previous-run promise
	expect(prevs).toEqual([undefined, undefined, undefined])

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
